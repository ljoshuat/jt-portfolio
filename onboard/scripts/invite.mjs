#!/usr/bin/env node
// Make a personal onboarding link that greets the client and fills in their details.
//
//   node scripts/invite.mjs <slug> "<Company>" ["<Contact name>"] [email]
//   node scripts/invite.mjs acme-co "Acme Co" "Jane Doe" jane@acme.co

import { execFileSync } from 'node:child_process';

const [slug, company, contact = '', email = ''] = process.argv.slice(2);
if (!slug || !company || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(slug)) {
  console.error('Usage: node scripts/invite.mjs <slug> "<Company>" ["<Contact name>"] [email]\n(slug: lowercase letters, numbers and dashes, 3+ characters)');
  process.exit(1);
}
const value = JSON.stringify({ company, contact, email });
execFileSync('npx', ['wrangler', 'kv', 'key', 'put', `invite:${slug}`, value, '--binding', 'ONBOARDING', '--remote'], { stdio: 'inherit' });
console.log(`\nSend this link: https://onboard.jtcreative.design/${slug}`);
