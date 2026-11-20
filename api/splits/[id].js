// GET /api/splits/:id  -> { split, version }
// PUT /api/splits/:id  body { split, baseVersion } -> { version } or 409 { split, version } if someone saved first
const { redis, clean, send, TTL, ID_RE } = require("../_store");

// Compare-and-set: only write when the stored version is the one the editor started from.
const CAS = `
local cur = redis.call('GET', KEYS[1])
if not cur then return {-1, ''} end
local v = cjson.decode(cur)['version']
if tonumber(ARGV[1]) ~= tonumber(v) then return {0, cur} end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
return {1, ''}`;

module.exports = async (req, res) => {
  const id = String((req.query && req.query.id) || "");
  if (!ID_RE.test(id)) return send(res, 404, { error: "No split with that link." });
  const key = "split:" + id;
  try {
    if (req.method === "GET") {
      const raw = await redis(["GET", key]);
      if (!raw) return send(res, 404, { error: "No split with that link. It may have expired." });
      const doc = JSON.parse(raw);
      return send(res, 200, { split: doc, version: doc.version });
    }
    if (req.method === "PUT") {
      const body = req.body || {};
      const base = Number(body.baseVersion);
      if (!Number.isInteger(base) || base < 1) return send(res, 400, { error: "Missing baseVersion." });
      const doc = { ...clean(body.split), id, version: base + 1, updatedAt: Date.now() };
      const [status, cur] = await redis(["EVAL", CAS, "1", key, String(base), JSON.stringify(doc), String(TTL)]);
      if (status === -1) return send(res, 404, { error: "No split with that link. It may have expired." });
      if (status === 0) { const latest = JSON.parse(cur); return send(res, 409, { error: "Someone saved a newer version.", split: latest, version: latest.version }); }
      return send(res, 200, { version: doc.version });
    }
    res.setHeader("Allow", "GET, PUT");
    send(res, 405, { error: "Use GET or PUT." });
  } catch (e) {
    send(res, e.status || 500, { error: e.status ? e.message : "Something went wrong." });
  }
};
