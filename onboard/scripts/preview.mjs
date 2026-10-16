#!/usr/bin/env node
// Render the form and thank-you page to dist/ to look at locally, no Cloudflare needed.

import { writeFileSync, mkdirSync } from 'node:fs';
import { renderForm, renderThanks } from '../src/form.js';

const out = new URL('../dist/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('form.html', out), renderForm({ demo: true }));
writeFileSync(new URL('invite.html', out), renderForm({ demo: true, client: { slug: 'acme-co', company: 'Acme Co', contact: 'Jane Doe', email: 'jane@acme.co' } }));
writeFileSync(new URL('thanks.html', out), renderThanks({ name: 'Jane' }));
console.log('Wrote dist/form.html, dist/invite.html and dist/thanks.html');
