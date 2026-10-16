# JT Creative onboarding

The client onboarding form at `onboard.jtcreative.design`. Built the same way
as `proposals/`: a small Cloudflare Worker with the same brand, answers stored
in Cloudflare KV (never in this repo), and pages marked `noindex`.

- `onboard.jtcreative.design` is the open form.
- `onboard.jtcreative.design/<client>` is a personal link that greets the
  client by name and fills in their company and email.
- Answers can post a summary to Slack, and you can read them in full from the
  command line.

## What it asks

Six sections: About you, The project (type and services as tappable chips),
Goals & audience, Budget & timeline, Assets & links, Anything else. Required:
name, email, company, project type, a short description and a budget range.
All questions and options live in `src/options.js`; change them there and the
page, the server check and the Slack summary all follow.

The page works without JavaScript. With it, a lime progress line and a section counter
(02 / 06) follow their place in the form, required answers are checked before sending, and a draft is kept in
their browser until they send it.

## One-time setup (on your Mac)

```sh
cd onboard
npm install
npx wrangler login
npx wrangler kv namespace create ONBOARDING   # paste the id into wrangler.toml
npx wrangler secret put SLACK_WEBHOOK_URL     # optional: a Slack incoming webhook URL
npx wrangler deploy
```

Until the custom domain is set up, the worker is live at
`https://jt-onboard.<your-subdomain>.workers.dev`.

### Custom domain

Same DNS move as `proposals/README.md` (jtcreative.design's DNS moves from
DreamHost to Cloudflare once, for both subdomains). After the domain is Active
in Cloudflare: Workers & Pages → jt-onboard → Settings → Domains & Routes →
Add → Custom domain → `onboard.jtcreative.design`.

### Brand fonts

Same as proposals: drop the woff2 files into `public/fonts/` (git-ignored) and
set `FONTS = "self"` in `wrangler.toml`.

## Using it

- Personal link: `npm run invite -- acme-co "Acme Co" "Jane Doe" jane@acme.co`
  prints `https://onboard.jtcreative.design/acme-co`.
- List answers: `npm run submissions`
- Read one in full: `npm run submissions -- latest` or `npm run submissions -- 3`
- Preview locally without Cloudflare: `npm run preview`, then open
  `dist/form.html`, `dist/invite.html` and `dist/thanks.html`.

## Spam and abuse

A hidden honeypot field drops bot sends silently, and each connection can send
5 times an hour. If spam becomes a problem, Cloudflare Turnstile can be added.

## Development

```sh
npm test        # node --test
npm run dev     # wrangler dev, local KV
```
