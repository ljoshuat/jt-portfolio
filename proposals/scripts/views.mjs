#!/usr/bin/env node
// When a proposal was opened (kept for a year), and whether it's been signed.
//
//   node scripts/views.mjs <slug>

import { execFileSync } from 'node:child_process';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node scripts/views.mjs <slug>'); process.exit(1); }

let signed = null;
try {
  const raw = execFileSync('npx', ['wrangler', 'kv', 'key', 'get', `signed:${slug}`, '--binding', 'PROPOSALS', '--remote'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  signed = raw && raw.startsWith('{') ? JSON.parse(raw) : null;
} catch { signed = null; }
const fmt = (iso) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
console.log(signed
  ? `SIGNED by ${signed.name} on ${fmt(signed.at)}${signed.country ? ` (${signed.country})` : ''}\n  IP ${signed.ip}  ·  proposal fingerprint ${signed.proposal.slice(0, 16)}…`
  : `${slug} isn't signed yet.`);

const out = execFileSync('npx', ['wrangler', 'kv', 'key', 'list', '--prefix', `view:${slug}:`, '--binding', 'PROPOSALS', '--remote'], { stdio: ['ignore', 'pipe', 'inherit'] });
const views = JSON.parse(out.toString()).map((k) => k.metadata || { at: k.name.split(':').slice(2).join(':') });

if (!views.length) { console.log(`${slug} hasn't been opened yet.`); process.exit(0); }
console.log(`${slug} opened ${views.length} time${views.length === 1 ? '' : 's'}:`);
for (const v of views.sort((a, b) => a.at.localeCompare(b.at))) {
  const when = fmt(v.at);
  console.log(`  ${when}  via ${v.via || '?'}${v.country ? `  (${v.country})` : ''}`);
}
