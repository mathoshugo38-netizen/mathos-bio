// Editable content: stored as one JSON document, with the previous version kept for "Desfazer".
const crypto = require("crypto");
const DEFAULTS = require("./_defaults");
const { pipeline } = require("./_redis");

function isAdmin(req) {
  const pass = process.env.ADMIN_PASSWORD, key = String(req.headers["x-admin-key"] || "");
  if (!pass) return false;
  const a = Buffer.from(key), b = Buffer.from(pass);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const str = (v, d, max) => (typeof v === "string" ? v.trim().slice(0, max) : d) || d;
const handle = (v, d) => { const h = String(v || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[@/]/g, "").toLowerCase(); return /^[a-z0-9._]{1,30}$/.test(h) ? h : d; };
const hour = (v, d) => { const n = parseInt(v, 10); return n >= 0 && n <= 24 ? n : d; };

// Merge anything stored or sent over the defaults, keeping only known fields within sane limits
function clean(input) {
  const i = input && typeof input === "object" ? input : {};
  const D = DEFAULTS, c = i.contato || {}, k = i.cartao || {}, b = i.bio || {};
  let wa = String(c.whatsapp || "").replace(/\D/g, "");
  if (wa && !wa.startsWith("55")) wa = "55" + wa;
  let abre = hour(c.abre, D.contato.abre), fecha = hour(c.fecha, D.contato.fecha);
  if (fecha <= abre) { abre = D.contato.abre; fecha = D.contato.fecha; }
  const btnIn = Array.isArray(b.botoes) ? b.botoes : [];
  return {
    contato: {
      whatsapp: /^55\d{10,11}$/.test(wa) ? wa : D.contato.whatsapp,
      telefone: str(c.telefone, D.contato.telefone, 30),
      site: str(String(c.site || "").replace(/^https?:\/\//i, "").replace(/\/+$/, ""), D.contato.site, 80),
      instagramHugo: handle(c.instagramHugo, D.contato.instagramHugo),
      instagramMathos: handle(c.instagramMathos, D.contato.instagramMathos),
      diaFim: +c.diaFim === 6 ? 6 : 5,
      abre, fecha
    },
    cartao: {
      topo: str(k.topo, D.cartao.topo, 40),
      frase: str(k.frase, D.cartao.frase, 160),
      sobre1: str(k.sobre1, D.cartao.sobre1, 400),
      sobre2: str(k.sobre2, D.cartao.sobre2, 400),
      mensagem: str(k.mensagem, D.cartao.mensagem, 300)
    },
    bio: {
      frase: str(b.frase, D.bio.frase, 120),
      botoes: D.bio.botoes.map(def => {
        const x = btnIn.find(y => y && y.id === def.id) || {};
        return { id: def.id, titulo: str(x.titulo, def.titulo, 40), sub: str(x.sub, def.sub, 70), msg: str(x.msg, def.msg, 300), visivel: x.visivel === undefined ? def.visivel : !!x.visivel };
      })
    },
    foto: { v: Math.max(0, parseInt((i.foto || {}).v, 10) || 0) }
  };
}

async function read() {
  const [cur, prev] = await pipeline([["GET", "cfg"], ["EXISTS", "cfg:prev"]]);
  let parsed = {};
  try { parsed = cur ? JSON.parse(cur) : {}; } catch {}
  return { cfg: clean(parsed), hasPrev: prev === 1, raw: cur };
}

async function save(next) {
  const { raw } = await read();
  const cfg = clean(next);
  await pipeline([["SET", "cfg:prev", raw || JSON.stringify(DEFAULTS)], ["SET", "cfg", JSON.stringify(cfg)]]);
  return cfg;
}

async function undo() {
  const [prev] = await pipeline([["GET", "cfg:prev"]]);
  if (!prev) return null;
  await pipeline([["SET", "cfg", prev], ["DEL", "cfg:prev"]]);
  return clean(JSON.parse(prev));
}

module.exports = { isAdmin, clean, read, save, undo, DEFAULTS };
