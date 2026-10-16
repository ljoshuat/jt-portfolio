#!/usr/bin/env node
// Render a proposal file to dist/ to look at locally, no Cloudflare needed.
//   node scripts/preview.mjs [proposal.json]   (defaults to the sample)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { renderProposal } from '../src/template.js';
import { renderGate } from '../src/gate.js';

const file = process.argv[2] || new URL('../samples/sample-client.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));
const out = new URL('../dist/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('preview.html', out), renderProposal(data));
writeFileSync(new URL('gate.html', out), renderGate({ demo: true }));
console.log('Wrote dist/preview.html and dist/gate.html');
