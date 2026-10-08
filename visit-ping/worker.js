// Visit ping: receives one beacon per browser session from jtcreative.design
// and posts a short Slack message with the visitor's approximate location.
// Location comes from Cloudflare's own edge data (request.cf); the raw IP is
// never stored or forwarded.
//
// Env:
//   SLACK_WEBHOOK_URL  (secret) Slack incoming webhook for the channel
//   ALLOWED_ORIGINS    comma list, default "https://www.jtcreative.design,https://jtcreative.design"
//   MAX_PER_HOUR       optional cap on Slack posts per hour, default 30

const BOT_RE = /bot|crawl|spider|slurp|preview|fetch|monitor|headless|lighthouse|pingdom|uptime|python|curl|wget|httpclient|axios|node-fetch|go-http|java\/|facebookexternalhit|embedly|whatsapp|telegram|discord|slack/i;
const DEDUPE_SECONDS = 30 * 60;

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

    // Server-side dedupe on a hash of IP + UA, kept only in the edge cache.
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const fp = await sha256(ip + '|' + ua);
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const dedupeKey = new Request('https://visit-ping.internal/seen/' + fp);
    if (cache && await cache.match(dedupeKey)) return done();

    // Flood guard per worker instance.
    const nowHour = new Date().toISOString().slice(0, 13);
    if (nowHour !== hourKey) { hourKey = nowHour; hourCount = 0; }
    if (hourCount >= Number(env.MAX_PER_HOUR || 30)) return done();
    hourCount++;

    if (cache) {
      ctx.waitUntil(cache.put(dedupeKey, new Response('1', {
        headers: { 'Cache-Control': 'max-age=' + DEDUPE_SECONDS },
      })));
    }

    const text = formatMessage(request.cf || {}, body, ua);
    ctx.waitUntil(fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, unfurl_links: false, unfurl_media: false }),
    }));
    return done();
  },
};

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
