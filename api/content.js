// GET: the current texts, contacts and photo version (public, read by both pages).
// PUT: save an edit from the panel. POST {undo:true}: go back to the previous version.
const { hasDb } = require("./_redis");
const { isAdmin, read, save, undo, clean, DEFAULTS } = require("./_cfg");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-key");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    if (!hasDb()) return res.status(200).json({ cfg: clean(DEFAULTS), hasPrev: false });
    try { const { cfg, hasPrev } = await read(); return res.status(200).json({ cfg, hasPrev }); }
    catch { return res.status(200).json({ cfg: clean(DEFAULTS), hasPrev: false }); }
  }

  res.setHeader("Cache-Control", "no-store");
  if (!isAdmin(req)) { await new Promise(r => setTimeout(r, 600)); return res.status(401).json({ error: "unauthorized" }); }
  if (!hasDb()) return res.status(503).json({ error: "no-db" });
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  try {
    if (req.method === "PUT") {
      const { cfg: cur } = await read();
      const cfg = await save({ ...b.cfg, foto: cur.foto });   // the photo only changes through /api/photo
      return res.status(200).json({ cfg, hasPrev: true });
    }
    if (req.method === "POST" && b.undo) {
      const cfg = await undo();
      if (!cfg) return res.status(409).json({ error: "nothing-to-undo" });
      return res.status(200).json({ cfg, hasPrev: false });
    }
  } catch { return res.status(502).json({ error: "db-error" }); }
  res.status(405).end();
};
