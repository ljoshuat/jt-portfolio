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

Until the custom domain is set up, the worker is live at
`https://jt-proposals.<your-subdomain>.workers.dev/<client>`.

### Custom domain (DNS currently on DreamHost)

Cloudflare can only serve `proposals.jtcreative.design` when it runs the
domain's DNS, so move it over (free plan):

1. Cloudflare dashboard → Add a domain → `jtcreative.design` → Free plan.
   Cloudflare scans and copies your current DNS records.
2. Compare the copied records with DreamHost (Panel → Websites → DNS) and make
   sure every one is there, especially the Webflow records (`A` / `CNAME` for
   `www`), the `MX` mail records and any `TXT` (SPF, DKIM, verification).
   Set the Webflow records to **DNS only** (grey cloud).
3. At DreamHost, switch the domain's nameservers to the two Cloudflare gives you
   (DreamHost: Websites → Manage Websites → DNS → use external nameservers;
   if the domain is registered elsewhere, change it at that registrar).
4. Once Cloudflare shows the domain as Active: Workers & Pages → jt-proposals →
   Settings → Domains & Routes → Add → Custom domain → `proposals.jtcreative.design`.

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

## Password screen style

`GATE_STYLE` in `wrangler.toml` picks the password screen background:
`"wave"` (dithered wave of angled pixels) or `"leaf"` (leaf field that lights
up around the pointer). Deploy after changing it.
