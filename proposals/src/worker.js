// proposals.jtcreative.design: one private page per client proposal.
//
//   GET  /<slug>         password screen, or the proposal once unlocked
//   POST /<slug>         check the password, set a cookie for this proposal
//   GET  /<slug>/logout  forget this browser
//
// Proposals live in the PROPOSALS KV namespace under "proposal:<slug>" as
// { password: {salt, iterations, hash}, data: {...} }. Add them with
// scripts/add-proposal.mjs; the content never lives in this repo.

import { renderProposal } from './template.js';
import { renderGate } from './gate.js';
import { verifyPassword, makeToken, checkToken } from './auth.js';

const COOKIE_DAYS = 30;
const MAX_ATTEMPTS = 8; // per IP per proposal per 15 minutes
const SLUG = /^[a-z0-9][a-z0-9-]{2,63}$/;

const SECURITY_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "frame-ancestors 'none'",
};

const html = (body, status = 200, extra = {}) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS, ...extra } });

const cookieName = (slug) => `jtp_${slug.replace(/-/g, '_')}`;

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(/;\s*/)) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return '';
}

async function tooManyAttempts(env, key) {
  const n = Number((await env.PROPOSALS.get(key)) || 0);
  return n >= MAX_ATTEMPTS;
}

async function countAttempt(env, key) {
  const n = Number((await env.PROPOSALS.get(key)) || 0) + 1;
  await env.PROPOSALS.put(key, String(n), { expirationTtl: 900 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const selfHostedFonts = env.FONTS === 'self';

    if (parts.length === 0) return Response.redirect('https://www.jtcreative.design', 302);

    const slug = parts[0].toLowerCase();
    if (!SLUG.test(slug)) return html(renderGate({ style: env.GATE_STYLE, selfHostedFonts }), 404);

    const name = cookieName(slug);
    const path = `/${slug}`;

    if (parts[1] === 'logout') {
      return new Response(null, {
        status: 303,
        headers: { Location: path, 'Set-Cookie': `${name}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, ...SECURITY_HEADERS },
      });
    }
    if (parts.length > 1) return html(renderGate({ style: env.GATE_STYLE, selfHostedFonts }), 404);

    // Unknown slugs get the same password screen, so nobody can tell which
    // proposals exist by guessing addresses.
    const record = await env.PROPOSALS.get(`proposal:${slug}`, 'json');

    if (request.method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const limitKey = `attempts:${slug}:${ip}`;
      if (await tooManyAttempts(env, limitKey)) {
        return html(renderGate({ style: env.GATE_STYLE, selfHostedFonts, error: 'Too many tries. Wait 15 minutes and try again.' }), 429);
      }
      const form = await request.formData().catch(() => null);
      const password = String(form?.get('password') || '');
      if (record && password && (await verifyPassword(password, record.password))) {
        const token = await makeToken(env.SESSION_SECRET, slug, record.password.hash, COOKIE_DAYS * 86400);
        return new Response(null, {
          status: 303,
          headers: {
            Location: path,
            'Set-Cookie': `${name}=${encodeURIComponent(token)}; Path=${path}; Max-Age=${COOKIE_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`,
            ...SECURITY_HEADERS,
          },
        });
      }
      await countAttempt(env, limitKey);
      return html(renderGate({ style: env.GATE_STYLE, selfHostedFonts, error: "That password didn't match. Check your email and try again." }), 401);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: SECURITY_HEADERS });
    }

    if (record && (await checkToken(env.SESSION_SECRET, slug, record.password.hash, readCookie(request, name)))) {
      return html(renderProposal(record.data, { selfHostedFonts }));
    }
    return html(renderGate({ style: env.GATE_STYLE, selfHostedFonts }));
  },
};
