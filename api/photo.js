// GET ?v=N: serves an uploaded photo of Hugo (v=0 or missing: the original file).
// POST (panel): upload a new photo, already resized by the panel. DELETE (panel): back to the original.
const { pipeline, hasDb } = require("./_redis");
const { isAdmin, read, save } = require("./_cfg");

const TYPES = new Set(["image/webp", "image/png", "image/jpeg"]);
const MAX_B64 = 900 * 1024;   // Upstash free accepts requests up to 1 MB

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET") {
    const v = parseInt(req.query.v, 10);
    if (!v || !hasDb()) { res.setHeader("Cache-Control", "no-store"); return res.redirect(302, "/hugo.webp"); }
    let raw;
    try { [raw] = await pipeline([["GET", `foto:${v}`]]); } catch {}
    if (!raw) { res.setHeader("Cache-Control", "no-store"); return res.redirect(302, "/hugo.webp"); }
    const { t, d } = JSON.parse(raw);
    res.setHeader("Content-Type", t);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");  // each version has its own URL
    return res.status(200).send(Buffer.from(d, "base64"));
  }

  res.setHeader("Cache-Control", "no-store");
  if (!isAdmin(req)) { await new Promise(r => setTimeout(r, 600)); return res.status(401).json({ error: "unauthorized" }); }
  if (!hasDb()) return res.status(503).json({ error: "no-db" });
  try {
    const { cfg } = await read();
    if (req.method === "DELETE") return res.status(200).json({ cfg: await save({ ...cfg, foto: { v: 0 } }), hasPrev: true });
    if (req.method === "POST") {
      let b = req.body;
      if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
      const t = String((b || {}).type || ""), d = String((b || {}).data || "");
      if (!TYPES.has(t) || !/^[A-Za-z0-9+/=]+$/.test(d)) return res.status(400).json({ error: "bad-image" });
      if (d.length > MAX_B64) return res.status(413).json({ error: "too-big" });
      const [v] = await pipeline([["INCR", "foto:seq"]]);
      await pipeline([["SET", `foto:${v}`, JSON.stringify({ t, d })], ["DEL", `foto:${v - 4}`]]);   // keep the last few for "Desfazer"
      return res.status(200).json({ cfg: await save({ ...cfg, foto: { v } }), hasPrev: true });
    }
  } catch { return res.status(502).json({ error: "db-error" }); }
  res.status(405).end();
};
