import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import worker from '../src/worker.js';
import { hashPassword, verifyPassword } from '../src/auth.js';
import { renderProposal } from '../src/template.js';

const sample = JSON.parse(readFileSync(new URL('../samples/sample-client.json', import.meta.url), 'utf8'));

function memoryKV(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    async get(k, type) { const v = m.get(k); return v == null ? null : type === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, v); },
    keys: () => [...m.keys()],
  };
}

const KEY = 'test-link-key-abcdefghijklmnop';

async function setup(password = 'lime-leaf-1234') {
  const record = { password: await hashPassword(password), key: KEY, data: sample };
  return { env: { PROPOSALS: memoryKV({ 'proposal:acme-co': JSON.stringify(record) }), SESSION_SECRET: 'test-secret', FONTS: 'google' }, password };
}

const post = (path, password, ip = '1.2.3.4') =>
  new Request(`https://proposals.example${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'CF-Connecting-IP': ip },
    body: new URLSearchParams({ password }),
  });

test('password hashing round-trips and rejects wrong passwords', async () => {
  const rec = await hashPassword('correct horse');
  assert.equal(await verifyPassword('correct horse', rec), true);
  assert.equal(await verifyPassword('wrong', rec), false);
});

test('locked proposal shows the gate, not the content', async () => {
  const { env } = await setup();
  const res = await worker.fetch(new Request('https://proposals.example/acme-co'), env);
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.match(body, /Open proposal/);
  assert.doesNotMatch(body, /\$00,000/);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});

test('right password sets a cookie that unlocks the proposal', async () => {
  const { env, password } = await setup();
  const res = await worker.fetch(post('/acme-co', password), env);
  assert.equal(res.status, 303);
  const cookie = res.headers.get('Set-Cookie');
  assert.match(cookie, /^jtp_acme_co=.+; Path=\/acme-co; .*HttpOnly; Secure/);
  const page = await worker.fetch(new Request('https://proposals.example/acme-co', { headers: { Cookie: cookie.split(';')[0] } }), env);
  assert.match(await page.text(), /The investment/);
});

test('wrong password is rejected and rate limited', async () => {
  const { env } = await setup();
  for (let i = 0; i < 8; i++) assert.equal((await worker.fetch(post('/acme-co', 'nope'), env)).status, 401);
  assert.equal((await worker.fetch(post('/acme-co', 'nope'), env)).status, 429);
});

test('unknown proposal looks the same as a locked one', async () => {
  const { env } = await setup();
  const res = await worker.fetch(new Request('https://proposals.example/does-not-exist'), env);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Open proposal/);
  assert.equal((await worker.fetch(post('/does-not-exist', 'x'), env)).status, 401);
});

test('a forged or other-proposal cookie does not unlock', async () => {
  const { env } = await setup();
  const res = await worker.fetch(new Request('https://proposals.example/acme-co', { headers: { Cookie: 'jtp_acme_co=9999999999.forged' } }), env);
  assert.doesNotMatch(await res.text(), /The investment/);
});

test('proposal content is escaped', () => {
  const out = renderProposal({ ...sample, client: '<script>alert(1)</script>' });
  assert.doesNotMatch(out, /<script>alert/);
  assert.match(out, /&lt;script&gt;alert/);
});

test('sign button uses the DocuSign link and ignores non-https links', () => {
  const docusign = { ...sample.contact, signUrl: 'https://powerforms.docusign.net/abc-123', signLabel: 'Review & sign' };
  const withSign = renderProposal({ ...sample, contact: docusign });
  assert.match(withSign, /href="https:\/\/powerforms\.docusign\.net\/[^"]+" target="_blank" rel="noopener noreferrer">Review &amp; sign/);
  const bad = renderProposal({ ...sample, contact: { ...docusign, signUrl: 'javascript:alert(1)' } });
  assert.doesNotMatch(bad, /javascript:/);
  assert.match(bad, /href="mailto:/);
});

test('private link unlocks, drops the key from the address and logs the view', async () => {
  const { env } = await setup();
  const res = await worker.fetch(new Request(`https://proposals.example/acme-co?k=${KEY}`), env);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('Location'), '/acme-co');
  const cookies = res.headers.getSetCookie().map((c) => c.split(';')[0]);
  assert.equal(cookies.length, 2);
  const welcome = await worker.fetch(new Request('https://proposals.example/acme-co', { headers: { Cookie: cookies.join('; ') } }), env);
  const welcomeHtml = await welcome.text();
  assert.match(welcomeHtml, /Hello, Client Name\./);
  assert.match(welcomeHtml, /href="\/acme-co"/);
  assert.doesNotMatch(welcomeHtml, /The investment/);
  const page = await worker.fetch(new Request('https://proposals.example/acme-co', { headers: { Cookie: cookies[0] } }), env);
  assert.match(await page.text(), /The investment/);
  assert.ok(env.PROPOSALS.keys().some((k) => k.startsWith('view:acme-co:')));
});

test('a wrong or missing link key shows the password screen', async () => {
  const { env } = await setup();
  for (const k of ['wrong', '']) {
    const res = await worker.fetch(new Request(`https://proposals.example/acme-co?k=${k}`), env);
    assert.equal(res.status, 401);
    assert.equal(res.headers.get('Set-Cookie'), null);
    assert.match(await res.text(), /That link didn/);
  }
  const unknown = await worker.fetch(new Request(`https://proposals.example/nope-co?k=${KEY}`), env);
  assert.equal(unknown.status, 401);
});

async function unlock(env) {
  const res = await worker.fetch(new Request(`https://proposals.example/acme-co?k=${KEY}`), env);
  return res.headers.getSetCookie().map((c) => c.split(';')[0]).find((c) => c.startsWith('jtp_acme_co='));
}
const sign = (cookie, fields) =>
  new Request('https://proposals.example/acme-co/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie || '', 'CF-Connecting-IP': '5.6.7.8' },
    body: new URLSearchParams(fields),
  });

test('a client can sign once, and the proposal shows who signed', async () => {
  const { env } = await setup();
  const cookie = await unlock(env);
  const page = await (await worker.fetch(new Request('https://proposals.example/acme-co', { headers: { Cookie: cookie } }), env)).text();
  assert.match(page, /<form class="sign" method="post" action="\/acme-co\/sign">/);

  const res = await worker.fetch(sign(cookie, { name: '  Jane   Client ', agree: 'on' }), env);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('Location'), '/acme-co#sign');
  const saved = JSON.parse(env.PROPOSALS.keys().includes('signed:acme-co') && (await env.PROPOSALS.get('signed:acme-co')));
  assert.equal(saved.name, 'Jane Client');
  assert.equal(saved.ip, '5.6.7.8');
  assert.match(saved.proposal, /^[0-9a-f]{64}$/);

  await worker.fetch(sign(cookie, { name: 'Someone Else', agree: 'on' }), env);
  assert.equal(JSON.parse(await env.PROPOSALS.get('signed:acme-co')).name, 'Jane Client');

  const after = await (await worker.fetch(new Request('https://proposals.example/acme-co', { headers: { Cookie: cookie } }), env)).text();
  assert.match(after, /Signed\. Thank you\./);
  assert.match(after, /Jane Client/);
  assert.doesNotMatch(after, /<form class="sign"/);
});

test('signing needs an unlocked browser, a name and consent', async () => {
  const { env } = await setup();
  const locked = await worker.fetch(sign('', { name: 'Jane Client', agree: 'on' }), env);
  assert.equal(locked.status, 403);
  const cookie = await unlock(env);
  await worker.fetch(sign(cookie, { name: 'Jane Client' }), env);
  await worker.fetch(sign(cookie, { name: 'J', agree: 'on' }), env);
  assert.equal(await env.PROPOSALS.get('signed:acme-co'), null);
});
