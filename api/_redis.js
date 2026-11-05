// Small Upstash Redis REST client. The Upstash integration on Vercel provides these variables.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const hasDb = () => !!(URL_ && TOKEN);

async function pipeline(cmds) {
  if (!hasDb()) throw new Error("no-db");
  const r = await fetch(URL_.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).map(x => x.result);
}

const TZ = "America/Sao_Paulo";
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Day, hour and weekday in Brasília time
function parts(d = new Date()) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short" });
  const o = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  return { day: `${o.year}-${o.month}-${o.day}`, hour: +o.hour, wd: WD.indexOf(o.weekday) };
}

function dayList(n) {
  const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(f.format(new Date(Date.now() - i * 864e5)));
  return out;
}

module.exports = { pipeline, parts, dayList, hasDb };
