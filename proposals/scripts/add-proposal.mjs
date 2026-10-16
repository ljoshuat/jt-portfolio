#!/usr/bin/env node
// Upload (or replace) one client proposal.
//
//   node scripts/add-proposal.mjs <slug> <proposal.json> [--password <pw>]
//
// Without --password a readable random one is generated and printed. Send it
// to the client separately from the link. The proposal file can live
// anywhere (keep client files out of git); only the hash is stored.

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { hashPassword } from '../src/auth.js';

const [slug, file, ...rest] = process.argv.slice(2);
if (!slug || !file || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(slug)) {
  console.error('Usage: node scripts/add-proposal.mjs <slug: lowercase, digits, dashes> <proposal.json> [--password <pw>]');
  process.exit(1);
}

const pwIndex = rest.indexOf('--password');
const words = ['lime', 'slant', 'leaf', 'pixel', 'orbit', 'stamp', 'swoop', 'grid', 'ink', 'notch', 'badge', 'trio'];
const pick = () => words[crypto.getRandomValues(new Uint32Array(1))[0] % words.length];
const password = pwIndex >= 0 ? rest[pwIndex + 1] : `${pick()}-${pick()}-${crypto.getRandomValues(new Uint32Array(1))[0] % 9000 + 1000}`;
if (!password) { console.error('--password needs a value'); process.exit(1); }

const data = JSON.parse(readFileSync(file, 'utf8'));
const record = { password: await hashPassword(password), data, updated: new Date().toISOString() };

const dir = mkdtempSync(join(tmpdir(), 'jtp-'));
const tmp = join(dir, 'record.json');
writeFileSync(tmp, JSON.stringify(record));
try {
  execFileSync('npx', ['wrangler', 'kv', 'key', 'put', `proposal:${slug}`, '--path', tmp, '--binding', 'PROPOSALS', '--remote'], { stdio: 'inherit' });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\nLive at https://proposals.jtcreative.design/${slug}\nPassword: ${password}`);
