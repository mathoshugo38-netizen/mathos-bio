// Records one anonymous event: a page view or a button click. No personal data is stored;
// unique visitors are counted from a random id kept in the visitor's own browser.
const { pipeline, parts, hasDb } = require("./_redis");

const SITES = new Set(["bio", "card"]);
const EVENT = /^(view|click:[a-z0-9_]{1,32})$/;
const TTL = 60 * 60 * 24 * 400; // keep a bit over a year

function source(ref, ua) {
  ref = String(ref || "").toLowerCase();
  if (/Instagram/.test(ua) || ref.includes("instagram.com")) return "instagram";
  if (/FBAN|FBAV|FB_IAB/.test(ua) || ref.includes("facebook.com")) return "facebook";
  if (ref.includes("whatsapp")) return "whatsapp";
  if (ref.includes("google.")) return "google";
  if (ref.includes("mathoscontabilidade.com.br") || ref.includes(".vercel.app")) return "interno";
  return ref ? "outros" : "direto";
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") return res.status(405).end();

  const ua = String(req.headers["user-agent"] || "");
  // link previews and crawlers are not visitors
  if (/bot|crawl|spider|facebookexternalhit|WhatsApp\/|preview/i.test(ua) && !/Instagram/.test(ua)) return res.status(204).end();

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  const s = String(b.s || ""), e = String(b.e || "");
  if (!SITES.has(s) || !EVENT.test(e)) return res.status(400).end();
  if (!hasDb()) return res.status(204).end();

  const { day, hour, wd } = parts();
  const dk = `m:d:${day}`;
  const cmds = [["HINCRBY", dk, `${s}:${e}`, 1], ["EXPIRE", dk, TTL]];
  if (e === "view") {
    const sk = `m:src:${day}`, vk = `m:dev:${day}`;
    const dev = /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
    cmds.push(["HINCRBY", sk, `${s}:${source(b.r, ua)}`, 1], ["EXPIRE", sk, TTL],
              ["HINCRBY", vk, `${s}:${dev}`, 1], ["EXPIRE", vk, TTL],
              ["HINCRBY", "m:h", `${s}:${wd}-${hour}`, 1]);
    const v = String(b.v || "");
    if (/^[a-z0-9]{6,40}$/.test(v)) {
      for (const uk of [`m:u:${day}:${s}`, `m:u:${day}`]) cmds.push(["PFADD", uk, v], ["EXPIRE", uk, TTL]);
    }
  }
  try { await pipeline(cmds); } catch { /* counting must never break the page */ }
  res.status(204).end();
};
