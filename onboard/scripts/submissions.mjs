#!/usr/bin/env node
// Read onboarding answers.
//
//   node scripts/submissions.mjs          list everything, newest first
//   node scripts/submissions.mjs latest   show the newest in full
//   node scripts/submissions.mjs <n>      show number <n> from the list in full

import { execFileSync } from 'node:child_process';
import { FIELDS } from '../src/options.js';

const wr = (args) => execFileSync('npx', ['wrangler', 'kv', ...args, '--binding', 'ONBOARDING', '--remote'], { stdio: ['ignore', 'pipe', 'inherit'] }).toString();

const keys = JSON.parse(wr(['key', 'list', '--prefix', 'submission:'])).sort((a, b) => b.name.localeCompare(a.name));
if (!keys.length) { console.log('No onboarding answers yet.'); process.exit(0); }

const pick = process.argv[2];
if (!pick) {
  keys.forEach((k, i) => {
    const m = k.metadata || {};
    const when = new Date(m.at || k.name.split(':').slice(1, -1).join(':')).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    console.log(`${String(i + 1).padStart(3)}. ${when}  ${m.name || '?'} · ${m.company || '?'}  ${m.type || ''}  ${m.budget || ''}`);
  });
  console.log('\nShow one in full: npm run submissions -- <number>');
  process.exit(0);
}

const k = keys[pick === 'latest' ? 0 : Number(pick) - 1];
if (!k) { console.error(`No answer number ${pick}.`); process.exit(1); }
const rec = JSON.parse(wr(['key', 'get', k.name]));
console.log(`Sent ${new Date(rec.at).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}${rec.invite ? ` via invite ${rec.invite}` : ''}${rec.country ? ` from ${rec.country}` : ''}\n`);
for (const f of FIELDS) {
  const v = Array.isArray(rec.values[f.name]) ? rec.values[f.name].join(', ') : rec.values[f.name];
  if (v) console.log(`${f.label}\n  ${String(v).replace(/\n/g, '\n  ')}\n`);
}
