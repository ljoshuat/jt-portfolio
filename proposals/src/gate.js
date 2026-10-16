// The password screen a client sees before their proposal.
import { BRAND_CSS, FONT_FACES, MARK_SVG } from './brand.js';
import { esc } from './template.js';

export function renderGate({ client = '', error = '', selfHostedFonts = false } = {}) {
  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Proposal · JT Creative</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&family=Instrument+Serif:ital@1&family=Unbounded:wght@500;700&display=swap" rel="stylesheet">
<style>${selfHostedFonts ? FONT_FACES : ''}${BRAND_CSS}</style>
</head>
<body>
<main class="gate">
  <div class="gate-box">
    <span class="mark">${MARK_SVG}</span>
    <p class="label"><span class="leaf" aria-hidden="true"></span>Private proposal</p>
    <h1 class="h2">${client ? `Hello, ${esc(client)}.` : 'Hello.'}</h1>
    <p class="muted">Enter the password from your email to open your proposal.</p>
    <form method="post" autocomplete="off">
      <label class="meta" for="pw">Password</label>
      <input id="pw" name="password" type="password" required autofocus autocomplete="current-password">
      ${error ? `<p class="err" role="alert">${esc(error)}</p>` : ''}
      <button class="btn" type="submit">Open proposal</button>
    </form>
  </div>
</main>
</body>
</html>`;
}
