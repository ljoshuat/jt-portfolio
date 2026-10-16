import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

function memoryKV(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    async get(k, type) { const v = m.get(k); return v == null ? null : type === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, v); },
    keys: () => [...m.keys()],
    raw: m,
  };
}

const env = (extra = {}) => ({ ONBOARDING: memoryKV({ 'invite:acme-co': JSON.stringify({ company: 'Acme Co', contact: 'Jane Doe', email: 'jane@acme.co' }) }), FONTS: 'google', ...extra });

const good = () => {
  const f = new URLSearchParams({ name: 'Jane Doe', email: 'jane@acme.co', company: 'Acme Co', projectType: 'Brand + Website', description: 'A new brand and site.', budget: '$10k – $25k' });
  f.append('services', 'Web design');
  f.append('services', 'Logo & identity');
  f.append('services', 'Not a real option');
  return f;
};

const post = (path, body, ip = '1.2.3.4') =>
  new Request(`https://onboard.example${path}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'CF-Connecting-IP': ip }, body });

test('form page renders every section with option chips and is noindex', async () => {
  const res = await worker.fetch(new Request('https://onboard.example/'), env());
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  for (const h of ['About you', 'The project', 'Budget &amp; timeline', 'Assets &amp; links']) assert.match(body, new RegExp(h));
  assert.match(body, /type="radio" name="budget" value="Not sure yet"/);
  assert.match(body, /type="checkbox" name="services" value="Webflow development"/);
});

test('invite link greets the client and fills in their details', async () => {
  const body = await (await worker.fetch(new Request('https://onboard.example/acme-co'), env())).text();
  assert.match(body, /Hello, Jane\./);
  assert.match(body, /value="Acme Co"/);
  assert.match(body, /name="invite" value="acme-co"/);
});

test('unknown invite falls back to the plain form', async () => {
  const res = await worker.fetch(new Request('https://onboard.example/nobody-here'), env());
  assert.equal(res.status, 302);
});

test('a valid send is stored, with unknown options dropped, and redirects to thanks', async () => {
  const e = env();
  const res = await worker.fetch(post('/acme-co', good()), e);
  assert.equal(res.status, 303);
  assert.match(res.headers.get('Location'), /\/thanks\?n=Jane$/);
  const key = e.ONBOARDING.keys().find((k) => k.startsWith('submission:'));
  const rec = JSON.parse(e.ONBOARDING.raw.get(key));
  assert.equal(rec.invite, 'acme-co');
  assert.deepEqual(rec.values.services, ['Web design', 'Logo & identity']);
  assert.equal(rec.values.budget, '$10k – $25k');
});

test('missing required answers re-render with errors and keep what was typed', async () => {
  const f = good();
  f.delete('budget');
  f.set('email', 'not-an-email');
  const res = await worker.fetch(post('/', f), env());
  const body = await res.text();
  assert.equal(res.status, 422);
  assert.match(body, /Pick one\./);
  assert.match(body, /Check this email address\./);
  assert.match(body, /value="Jane Doe"/);
  assert.match(body, /value="Web design" checked/);
});

test('honeypot sends are dropped silently', async () => {
  const e = env();
  const f = good();
  f.set('company_url', 'http://spam.example');
  const res = await worker.fetch(post('/', f), e);
  assert.equal(res.status, 303);
  assert.ok(!e.ONBOARDING.keys().some((k) => k.startsWith('submission:')));
});

test('sends are rate limited per connection', async () => {
  const e = env();
  for (let i = 0; i < 5; i++) assert.equal((await worker.fetch(post('/', good()), e)).status, 303);
  assert.equal((await worker.fetch(post('/', good()), e)).status, 429);
});

test('answers are escaped when re-shown', async () => {
  const f = good();
  f.delete('budget');
  f.set('name', '<script>alert(1)</script>');
  const body = await (await worker.fetch(post('/', f), env())).text();
  assert.doesNotMatch(body, /<script>alert/);
});

test('Slack gets a summary when the webhook is set', async () => {
  const sent = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => { sent.push({ url, body: JSON.parse(init.body) }); return new Response('ok'); };
  try {
    await worker.fetch(post('/', good()), env({ SLACK_WEBHOOK_URL: 'https://hooks.slack.example/x' }));
  } finally { globalThis.fetch = realFetch; }
  assert.equal(sent.length, 1);
  assert.match(sent[0].body.text, /New onboarding form\* from Jane Doe at Acme Co/);
  assert.match(sent[0].body.text, /Services you need:\* Web design, Logo & identity/);
});

test('thank-you page greets by first name', async () => {
  const body = await (await worker.fetch(new Request('https://onboard.example/thanks?n=Jane'), env())).text();
  assert.match(body, /Thank you, Jane\./);
});
