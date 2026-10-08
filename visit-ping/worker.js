// Visit ping: receives page-view beacons from jtcreative.design. The first
// page of a visit posts a Slack message with the visitor's approximate
// location; later pages in the same visit are added as thread replies under it.
// Location comes from Cloudflare's own edge data (request.cf); the raw IP is
// never stored or forwarded.
//
// Env:
//   SLACK_BOT_TOKEN    (secret) xoxb- token with chat:write; enables page threads
//   SLACK_CHANNEL      channel id for chat.postMessage (e.g. C0C7NJ40V9R)
//   SLACK_WEBHOOK_URL  (secret) fallback when no bot token: first page only, no threads
//   VISITS             KV namespace: visit id -> Slack thread ts, IP-hash dedupe
//   ALLOWED_ORIGINS    comma list, default "https://www.jtcreative.design,https://jtcreative.design"
//   MAX_PER_HOUR       optional cap on new-visitor posts per hour, default 30

const BOT_RE = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|pingdom|uptime|python|curl|wget|httpclient|axios|node-fetch|go-http|java\/|facebookexternalhit|embedly|whatsapp|telegram|discord|slack/i;
const DEDUPE_SECONDS = 30 * 60;
const VISIT_SECONDS = 6 * 60 * 60;
const MAX_PAGES = 30;

let hourKey = '';
let hourCount = 0;

export default {
  async fetch(request, env, ctx) {
    const allowed = (env.ALLOWED_ORIGINS || 'https://www.jtcreative.design,https://jtcreative.design')
      .split(',').map(s => s.trim());
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      Vary: 'Origin',
    };
    const done = (status = 204) => new Response(null, { status, headers: cors });

    if (request.method === 'OPTIONS') return done();
    if (request.method !== 'POST') return done(405);
    if (!allowed.includes(origin)) return done(403);

    const ua = request.headers.get('User-Agent') || '';
    if (!ua || BOT_RE.test(ua)) return done();

    let body = {};
    try { body = JSON.parse(await request.text()); } catch (e) { return done(400); }
    const sid = /^[a-z0-9]{8,40}$/i.test(body.sid || '') ? body.sid : '';
    const n = Number(body.n) || 1;
    const kv = env.VISITS || memoryKV;

    // Later page of a known visit: reply in that visit's thread.
    if (n > 1) {
      if (!sid || !env.SLACK_BOT_TOKEN || n > MAX_PAGES) return done();
      const ts = await kv.get('visit:' + sid);
      if (!ts) return done();
      ctx.waitUntil(slackPost(env, { text: `→ ${clean(body.path) || '/'}`, thread_ts: ts }));
      return done();
    }

    // First page: dedupe repeat visitors on a hash of IP + UA (never the IP itself).
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const fp = await sha256(ip + '|' + ua);
    if (await kv.get('seen:' + fp)) return done();

    const nowHour = new Date().toISOString().slice(0, 13);
    if (nowHour !== hourKey) { hourKey = nowHour; hourCount = 0; }
    if (hourCount >= Number(env.MAX_PER_HOUR || 30)) return done();
    hourCount++;

    const text = formatMessage(request.cf || {}, body, ua);
    ctx.waitUntil((async () => {
      let posted = false;
      if (env.SLACK_BOT_TOKEN) {
        const ts = await slackPost(env, { text });
        if (ts) {
          posted = true;
          if (sid) await kv.put('visit:' + sid, ts, { expirationTtl: VISIT_SECONDS });
        }
      }
      // No bot token, or the bot post failed: fall back to the webhook (no threads).
      if (!posted && env.SLACK_WEBHOOK_URL) {
        const res = await fetch(env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, unfurl_links: false, unfurl_media: false }),
        });
        posted = res.ok;
      }
      // Only count the visitor as seen once Slack actually has the message.
      if (posted) await kv.put('seen:' + fp, '1', { expirationTtl: DEDUPE_SECONDS });
    })());
    return done();
  },
};

async function slackPost(env, msg) {
  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: 'Bearer ' + env.SLACK_BOT_TOKEN,
    },
    body: JSON.stringify({ channel: env.SLACK_CHANNEL, unfurl_links: false, unfurl_media: false, ...msg }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) console.log('slack error', data.error);
  return data.ok ? data.ts : '';
}

// Used only when no KV namespace is bound (local tests).
const memoryKV = (() => {
  const m = new Map();
  return {
    async get(k) { const v = m.get(k); return v && v.exp > Date.now() ? v.val : null; },
    async put(k, val, o = {}) { m.set(k, { val, exp: Date.now() + (o.expirationTtl || 60) * 1000 }); },
  };
})();

export function formatMessage(cf, body, ua) {
  const place = [cf.city, cf.region, cf.country].filter(Boolean).join(', ') || 'Unknown location';
  const flag = flagEmoji(cf.country);
  const page = clean(body.path) || '/';
  const ref = referrerLabel(clean(body.ref));
  const device = deviceLabel(ua);
  const lines = [
    `${flag ? flag + ' ' : ''}*New visitor* from ${place}`,
    `Page: ${page}`,
    `From: ${ref}`,
    `Device: ${device}`,
  ];
  return lines.join('\n');
}

function referrerLabel(ref) {
  if (!ref) return 'Direct / unknown';
  try {
    const u = new URL(ref);
    const host = u.hostname.replace(/^www\./, '');
    if (/jtcreative\.design$/.test(host)) return 'Direct / unknown';
    if (/(^|\.)linkedin\.com$|lnkd\.in$/.test(host)) return 'LinkedIn';
    if (/(^|\.)google\./.test(host)) return 'Google';
    if (/(^|\.)bing\.com$/.test(host)) return 'Bing';
    if (/(^|\.)instagram\.com$/.test(host)) return 'Instagram';
    if (/(^|\.)(facebook|fb)\.com$/.test(host)) return 'Facebook';
    if (/(^|\.)(x|twitter)\.com$|t\.co$/.test(host)) return 'X / Twitter';
    if (/(^|\.)behance\.net$/.test(host)) return 'Behance';
    if (/(^|\.)dribbble\.com$/.test(host)) return 'Dribbble';
    return host;
  } catch (e) { return 'Direct / unknown'; }
}

export function deviceLabel(ua) {
  const kind = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? 'Tablet'
    : /Mobi|iPhone|Android/i.test(ua) ? 'Phone' : 'Desktop';
  const os = /iPhone|iPad|iOS/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android'
    : /Mac OS X|Macintosh/i.test(ua) ? 'Mac' : /Windows/i.test(ua) ? 'Windows'
    : /CrOS/i.test(ua) ? 'ChromeOS' : /Linux/i.test(ua) ? 'Linux' : '';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\/|CriOS/.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari' : '';
  return [kind, [os, browser].filter(Boolean).join(' · ')].filter(Boolean).join(', ');
}

function clean(s) {
  return String(s || '').replace(/[<>&`*_~|]/g, '').slice(0, 200);
}

function flagEmoji(cc) {
  if (!/^[A-Z]{2}$/.test(cc || '')) return '';
  return String.fromCodePoint(...[...cc].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
