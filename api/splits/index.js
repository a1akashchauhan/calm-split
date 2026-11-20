// POST /api/splits  -> create a split, returns { id, version }
const { redis, newId, clean, send, TTL } = require("../_store");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return send(res, 405, { error: "Use POST." }); }
  try {
    const split = clean(req.body && req.body.split);
    for (let attempt = 0; attempt < 3; attempt++) {
      const id = newId();
      const doc = { ...split, id, version: 1, updatedAt: Date.now() };
      const ok = await redis(["SET", "split:" + id, JSON.stringify(doc), "EX", String(TTL), "NX"]);
      if (ok === "OK") return send(res, 201, { id, version: 1 });
    }
    send(res, 500, { error: "Couldn't create a link. Try again." });
  } catch (e) {
    send(res, e.status || 500, { error: e.status ? e.message : "Something went wrong." });
  }
};
