// onboard.jtcreative.design: the client onboarding form.
//
//   GET  /          the form
//   GET  /<invite>  the form, greeting the client and filling in what's known
//   POST /, /<invite>  check and store the answers, then show the thank-you page
//   GET  /thanks    thank-you page (after a successful send)
//
// Answers are stored in the ONBOARDING KV namespace as
// "submission:<time>:<id>" (JSON, with a short summary in the key metadata)
// and read with scripts/submissions.mjs. Invites live under "invite:<slug>"
// as { company, contact, email }; add them with scripts/invite.mjs.
// If the SLACK_WEBHOOK_URL secret is set, each new answer posts a summary
// to Slack.

import { renderForm, renderThanks } from './form.js';
import { SECTIONS, readSubmission } from './options.js';

const MAX_SENDS = 5; // per IP per hour
const SLUG = /^[a-z0-9][a-z0-9-]{2,63}$/;

const SECURITY_HEADERS = {
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "frame-ancestors 'none'",
};

const html = (body, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS } });

async function getInvite(env, slug) {
  if (!slug || !SLUG.test(slug)) return null;
  const rec = await env.ONBOARDING.get(`invite:${slug}`, 'json');
  return rec ? { ...rec, slug } : null;
}

function slackText(values, invite) {
  const lines = [`*New onboarding form* from ${values.name} at ${values.company}${invite ? ` (invite: ${invite})` : ''}`];
  for (const s of SECTIONS) {
    for (const f of s.fields) {
      const v = Array.isArray(values[f.name]) ? values[f.name].join(', ') : values[f.name];
      if (v) lines.push(`*${f.label}:* ${v.length > 600 ? `${v.slice(0, 600)}…` : v}`);
    }
  }
  return lines.join('\n');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const selfHostedFonts = env.FONTS === 'self';

    if (parts.length > 1) return html(renderForm({ selfHostedFonts }), 404);
    const slug = (parts[0] || '').toLowerCase();

    if (slug === 'thanks') {
      return html(renderThanks({ name: url.searchParams.get('n') || '', selfHostedFonts }));
    }

    const invite = await getInvite(env, slug);
    const action = invite ? `/${invite.slug}` : '/';
    if (slug && !invite && request.method === 'GET') return Response.redirect(`${url.origin}/`, 302);

    if (request.method === 'GET' || request.method === 'HEAD') {
      return html(renderForm({ client: invite, selfHostedFonts, action }));
    }
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: SECURITY_HEADERS });

    const form = await request.formData().catch(() => null);
    if (!form) return html(renderForm({ client: invite, selfHostedFonts, action }), 400);

    // Bots fill the hidden field. Pretend it worked and store nothing.
    if (String(form.get('company_url') || '')) return Response.redirect(`${url.origin}/thanks`, 303);

    const { values, errors } = readSubmission(form);
    if (Object.keys(errors).length) return html(renderForm({ values, errors, client: invite, selfHostedFonts, action }), 422);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limitKey = `sends:${ip}`;
    const sends = Number((await env.ONBOARDING.get(limitKey)) || 0);
    if (sends >= MAX_SENDS) {
      return html(renderForm({ values, errors: { notes: 'Too many sends from this connection. Try again in an hour.' }, client: invite, selfHostedFonts, action }), 429);
    }
    await env.ONBOARDING.put(limitKey, String(sends + 1), { expirationTtl: 3600 });

    const at = new Date().toISOString();
    const id = crypto.randomUUID().slice(0, 8);
    const record = { at, invite: invite?.slug || '', country: request.cf?.country || '', values };
    await env.ONBOARDING.put(`submission:${at}:${id}`, JSON.stringify(record), {
      metadata: { at, name: values.name, company: values.company, type: values.projectType, budget: values.budget },
    });

    if (env.SLACK_WEBHOOK_URL) {
      const post = fetch(env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: slackText(values, invite?.slug) }),
      }).catch(() => {});
      if (ctx?.waitUntil) ctx.waitUntil(post); else await post;
    }

    return Response.redirect(`${url.origin}/thanks?n=${encodeURIComponent(values.name.split(' ')[0])}`, 303);
  },
};
