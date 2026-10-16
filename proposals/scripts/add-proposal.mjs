#!/usr/bin/env node
// Upload (or update) one client proposal.
//
//   node scripts/add-proposal.mjs <slug> <proposal.json> [--password <pw>] [--new-password] [--new-link]
//
// Prints the private link (one tap opens the proposal) and the password
// (fallback, e.g. if the link gets cut off in an email). Updating an existing
// proposal keeps its link and password unless you pass --new-link or
// --new-password; a new one signs everyone out. The proposal file can live
// anywhere (keep client files out of git); only the password hash is stored.

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { hashPassword, makeKey } from '../src/auth.js';

const [slug, file, ...rest] = process.argv.slice(2);
if (!slug || !file || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(slug)) {
  console.error('Usage: node scripts/add-proposal.mjs <slug: lowercase, digits, dashes> <proposal.json> [--password <pw>] [--new-password] [--new-link]');
  process.exit(1);
}
const flag = (f) => rest.includes(f);
const pwIndex = rest.indexOf('--password');
if (pwIndex >= 0 && !rest[pwIndex + 1]) { console.error('--password needs a value'); process.exit(1); }

const wrangler = (args, opts = {}) => execFileSync('npx', ['wrangler', ...args, '--binding', 'PROPOSALS', '--remote'], opts);

// The current record, if this proposal already exists.
let existing = null;
try {
  const out = wrangler(['kv', 'key', 'get', `proposal:${slug}`], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  existing = out ? JSON.parse(out) : null;
} catch { existing = null; }

const words = ['lime', 'slant', 'leaf', 'pixel', 'orbit', 'stamp', 'swoop', 'grid', 'ink', 'notch', 'badge', 'trio'];
const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];

let password = null; // only known (and printed) when set now
let passwordRecord = existing?.password;
if (pwIndex >= 0 || flag('--new-password') || !passwordRecord) {
  password = pwIndex >= 0 ? rest[pwIndex + 1] : `${pick()}-${pick()}-${crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000}`;
  passwordRecord = await hashPassword(password);
}
const key = !existing?.key || flag('--new-link') ? makeKey() : existing.key;

const data = JSON.parse(readFileSync(file, 'utf8'));

// Editing a signed proposal would change what the client sees after signing.
let signed = '';
try {
  signed = wrangler(['kv', 'key', 'get', `signed:${slug}`], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
} catch { signed = ''; }
if (signed.startsWith('{') && !flag('--force')) {
  const s = JSON.parse(signed);
  console.error(`${slug} was signed by ${s.name} on ${s.at}. Publishing would change the signed proposal.\nUse a new name for a revised proposal, or add --force if you really mean to edit it.`);
  process.exit(1);
}
const record = { password: passwordRecord, key, data, updated: new Date().toISOString() };

const dir = mkdtempSync(join(tmpdir(), 'jtp-'));
const tmp = join(dir, 'record.json');
writeFileSync(tmp, JSON.stringify(record));
try {
  wrangler(['kv', 'key', 'put', `proposal:${slug}`, '--path', tmp], { stdio: 'inherit' });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`
Private link: https://proposals.jtcreative.design/${slug}?k=${key}
Password:     ${password ?? '(unchanged)'}
Plain link:   https://proposals.jtcreative.design/${slug}  (asks for the password)`);
