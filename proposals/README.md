# JT Creative proposals

Password-protected client proposals at `proposals.jtcreative.design/<client>`.
A small Cloudflare Worker: each proposal has its own password, content lives in
Cloudflare KV (never in this repo), and pages are `noindex`.

## One-time setup (on your Mac)

```sh
cd proposals
npm install
npx wrangler login
npx wrangler kv namespace create PROPOSALS   # paste the id into wrangler.toml
npx wrangler secret put SESSION_SECRET       # any long random string, e.g. `openssl rand -hex 32`
npx wrangler deploy
```

Then in the Cloudflare dashboard: Workers & Pages → jt-proposals → Settings →
Domains & Routes → add custom domain `proposals.jtcreative.design`. This needs
`jtcreative.design` DNS on Cloudflare. If DNS lives elsewhere, add the domain to
Cloudflare first (free plan is fine) or point a CNAME at the worker.

### Brand fonts

The page falls back to Google stand-ins (Unbounded, Inter, Instrument Serif).
To use the licensed fonts, drop these into `public/fonts/` (git-ignored) and set
`FONTS = "self"` in `wrangler.toml`, then deploy:
`DrukWide-Bold.woff2`, `PPNeueMontreal-Regular.woff2`, `PPNeueMontreal-Medium.woff2`,
`PPEditorialNew-Italic.woff2`.

## Sending a proposal

1. Copy `samples/sample-client.json` to `clients/<client>.json` (git-ignored) and edit it.
   Leave out any section you don't need and it disappears from the page.
2. Preview it locally: `npm run preview -- clients/<client>.json`, open `dist/preview.html`.
3. Publish it: `npm run add -- <client-slug> clients/<client>.json`
   This prints the link and a generated password (or pass `--password <pw>`).
4. Send the link and the password separately.

Running `add` again with the same slug updates the proposal. Changing the
password signs out anyone who already opened it.

### DocuSign

Set `contact.signUrl` to a DocuSign link (a PowerForm works best: DocuSign →
Templates → your agreement → Create PowerForm) and the Next steps button becomes
"Review & sign", opening DocuSign in a new tab. `contact.signLabel` changes the
button text. Without `signUrl` the button falls back to an approval email.

## Security notes

- Passwords are stored as PBKDF2-SHA256 hashes; the cookie is HMAC-signed per proposal and expires after 30 days.
- 8 wrong tries per IP per proposal locks the form for 15 minutes.
- A link that doesn't exist shows the same password screen, so nobody can guess which proposals exist.

## Development

```sh
npm test        # node --test
npm run dev     # wrangler dev, local KV
```
