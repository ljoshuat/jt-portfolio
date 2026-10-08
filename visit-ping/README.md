# Visit ping

Posts a Slack message when someone new visits www.jtcreative.design:
city/region/country, page, where they came from, device. No Google Analytics,
no cookies, no raw IP stored or sent anywhere.

Pieces:
- `worker.js`: Cloudflare Worker (free plan). Reads location from Cloudflare's
  edge data, filters bots, dedupes repeat hits from the same visitor for 30 min,
  caps Slack posts at 30/hour, posts to a Slack incoming webhook.
- `snippet.html`: goes in Webflow Site settings > Custom code > Footer.
  Sends one beacon per browser session. `?noping` once on your own browsers
  stops your own visits from pinging; `?ping` turns it back on.

Setup:
1. Slack: create an app at api.slack.com/apps > Incoming Webhooks > on >
   Add New Webhook > pick the channel. Copy the webhook URL.
2. Cloudflare: free account, then from this folder:
   `npx wrangler login`, `npx wrangler secret put SLACK_WEBHOOK_URL`, `npx wrangler deploy`.
   (Or paste worker.js into a new Worker in the dashboard and add the secret there.)
3. Put the Worker URL into `ENDPOINT` in snippet.html and add it to the site footer.
