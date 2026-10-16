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
   This prints a **private link** and a **password**.
4. Email the private link. It opens on a welcome screen ("Hello, <client>.") whose
   Open proposal button plays the unlock and shows the proposal. That browser stays
   unlocked for 30 days; the key is dropped from the address bar after it opens.
   Anyone the client forwards the link to can open it too. The password is the
   fallback: the plain address `proposals.jtcreative.design/<client-slug>` asks for it.
5. See when it was opened: `npm run views -- <client-slug>`.

Running `add` again with the same slug updates the content and keeps the same
link and password. `--new-link` or `--new-password` replaces them and signs
everyone out (use it to cut off a forwarded link).

### Signing

Clients sign right on the proposal: they type their full name, tick the consent
box and tap **Sign proposal**. The first signature is stored as `signed:<slug>`
with the typed name, time, IP, country, browser and a SHA-256 fingerprint of the
exact proposal content, and the form is replaced by a signed record with a
"Save a copy (PDF)" button. `npm run views -- <slug>` shows it.

Once signed, `npm run add` refuses to change that proposal (publish a revision
under a new slug, or pass `--force`). `contact.signLabel` changes the button text.

To use DocuSign instead, set `contact.signUrl` to a PowerForm link (DocuSign →
Templates → your agreement → Create PowerForm; needs Business Pro) and the
button opens DocuSign in a new tab.

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
`"wave"` (halftone wave of angled pixels, same motion as the About page portrait) or `"leaf"` (leaf field that lights
up around the pointer). Deploy after changing it.
