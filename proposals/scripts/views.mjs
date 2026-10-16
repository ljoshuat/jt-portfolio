#!/usr/bin/env node
// When a proposal was opened (kept for a year).
//
//   node scripts/views.mjs <slug>

import { execFileSync } from 'node:child_process';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node scripts/views.mjs <slug>'); process.exit(1); }

const out = execFileSync('npx', ['wrangler', 'kv', 'key', 'list', '--prefix', `view:${slug}:`, '--binding', 'PROPOSALS', '--remote'], { stdio: ['ignore', 'pipe', 'inherit'] });
const views = JSON.parse(out.toString()).map((k) => k.metadata || { at: k.name.split(':').slice(2).join(':') });

if (!views.length) { console.log(`${slug} hasn't been opened yet.`); process.exit(0); }
console.log(`${slug} opened ${views.length} time${views.length === 1 ? '' : 's'}:`);
for (const v of views.sort((a, b) => a.at.localeCompare(b.at))) {
  const when = new Date(v.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  console.log(`  ${when}  via ${v.via || '?'}${v.country ? `  (${v.country})` : ''}`);
}
