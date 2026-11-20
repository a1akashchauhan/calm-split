// Shared helpers for the split API: Upstash Redis over REST, validation, ids.
const crypto = require("crypto");

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const TTL = 60 * 60 * 24 * 365; // a split lives a year after its last save
const ID_RE = /^[A-Za-z0-9]{12}$/;
const MAX_BYTES = 250 * 1024;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function redis(args) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new HttpError(503, "Storage isn't set up yet. Add the Upstash Redis integration in Vercel.");
  const r = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new HttpError(502, "Storage error: " + (j.error || r.status));
  return j.result;
}

function newId() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(12);
  let id = "";
  for (const b of bytes) id += abc[b % abc.length];
  return id;
}

const str = (v, max) => String(v == null ? "" : v).slice(0, max);
const ts = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 && n < 1e14 ? Math.round(n) : 0; };
const num = (v) => { const n = Number(v); return Number.isFinite(n) && n >= 0 && n < 1e9 ? Math.round(n * 100) / 100 : 0; };

// Keep only the fields the app uses, with sane limits.
function clean(split) {
  if (!split || typeof split !== "object") throw new HttpError(400, "Missing split.");
  if (JSON.stringify(split).length > MAX_BYTES) throw new HttpError(413, "This split is too large to save.");
  const members = Array.isArray(split.members) ? split.members.slice(0, 60) : [];
  if (members.length < 1) throw new HttpError(400, "A split needs at least one person.");
  const ids = new Set();
  const cleanMembers = members.map((m) => { const id = str(m && m.id, 40); ids.add(id); return { id, name: str(m && m.name, 40) || "Someone" }; });
  const expenses = (Array.isArray(split.expenses) ? split.expenses.slice(0, 1000) : []).map((e) => ({
    id: str(e && e.id, 40),
    payer: str(e && e.payer, 40),
    title: str(e && e.title, 60),
    amount: num(e && e.amount),
    shares: (Array.isArray(e && e.shares) ? e.shares : []).map((x) => str(x, 40)).filter((x) => ids.has(x)),
    flag: str(e && e.flag, 160),
    src: e && e.src ? { sender: str(e.src.sender, 60), time: str(e.src.time, 40), text: str(e.src.text, 600) } : null,
  }));
  const history = (Array.isArray(split.history) ? split.history.slice(-30) : []).map((h) => ({ by: str(h && h.by, 40), at: ts(h && h.at), what: str(h && h.what, 160) }));
  const transfers = (Array.isArray(split.transfers) ? split.transfers.slice(0, 200) : []).map((t) => ({ from: str(t && t.from, 40), to: str(t && t.to, 40), amt: num(t && t.amt) }));
  return {
    name: str(split.name, 80) || "Our trip",
    members: cleanMembers, expenses, history, transfers,
    savedTotal: num(split.savedTotal), savedAt: ts(split.savedAt), readBy: str(split.readBy, 40),
  };
}

function send(res, status, body) {
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

module.exports = { redis, newId, clean, send, HttpError, TTL, ID_RE };
