// Returns the numbers for the admin panel. Requires the ADMIN_PASSWORD set in Vercel.
const crypto = require("crypto");
const { pipeline, dayList, hasDb } = require("./_redis");

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
const toObj = a => {
  const o = {};
  if (Array.isArray(a)) for (let i = 0; i < a.length; i += 2) o[a[i]] = +a[i + 1];
  return o;
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return res.status(503).json({ error: "no-password" });
  if (!same(req.headers["x-admin-key"] || "", pass)) {
    await new Promise(r => setTimeout(r, 600));
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!hasDb()) return res.status(503).json({ error: "no-db" });

  const n = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 180);
  const days = dayList(n);
  const cmds = [];
  for (const d of days) cmds.push(["HGETALL", `m:d:${d}`], ["HGETALL", `m:src:${d}`], ["HGETALL", `m:dev:${d}`], ["PFCOUNT", `m:u:${d}:bio`], ["PFCOUNT", `m:u:${d}:card`]);
  cmds.push(["PFCOUNT", ...days.map(d => `m:u:${d}`)], ["HGETALL", "m:h"],
            ["PFCOUNT", ...days.map(d => `m:u:${d}:bio`)], ["PFCOUNT", ...days.map(d => `m:u:${d}:card`)]);
  let r;
  try { r = await pipeline(cmds); } catch { return res.status(502).json({ error: "db-error" }); }

  const k = days.length * 5;
  res.status(200).json({
    days: days.map((day, i) => ({
      day, counts: toObj(r[i * 5]), src: toObj(r[i * 5 + 1]), dev: toObj(r[i * 5 + 2]),
      uBio: r[i * 5 + 3] || 0, uCard: r[i * 5 + 4] || 0,
    })),
    uniqueTotal: r[k] || 0,
    heat: toObj(r[k + 1]),
    uniqueBio: r[k + 2] || 0,
    uniqueCard: r[k + 3] || 0,
  });
};
