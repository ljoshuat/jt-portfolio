# Mark pen on the JT Creative logo sheet (staged 2026-10-17)

Script (pinned): https://cdn.jsdelivr.net/gh/ljoshuat/jt-portfolio@1dde6220088a5df81b7902dee86fdd0fd9323acb/mark-pen.js
Source: repo ljoshuat/jt-portfolio, branch claude/project-thread-vi37v2, file mark-pen.js.
Preview: portfolio/mark-build/jt-mark-pen.html (project files).

## 1. Logo sheet embed (section#jt-logo-sheet, class "jtl")

a) Right after the closing `</svg>` of `svg.jtl-build`, still inside `.jtl-buildwrap`, add:

```html
<div class="jtl-pen" data-jt-mark-pen role="img" aria-label="The J mark traced point by point with the pen tool, ending on the badge"></div>
```

b) Add to the embed's `<style>` block, after the existing `.jtl-build` rules:

```css
.jtl-buildwrap{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(2rem,5vw,4rem);align-items:center}
.jtl-buildwrap>*{min-width:0}
.jtl-pen{width:100%;max-width:560px;justify-self:center}
@media (min-width:992px){.jtl-buildwrap{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)}}
```

Leave the existing mobile rule (`.jtl-buildwrap` overflow hidden, `.jtl-build` 170% width) as it is.
Result: side by side at 992px and up; below that the animation stacks under the diagram.

## 2. Site footer custom code (last line; Barba-safe, no-op on other pages)

```html
<script src="https://cdn.jsdelivr.net/gh/ljoshuat/jt-portfolio@1dde6220088a5df81b7902dee86fdd0fd9323acb/mark-pen.js" defer></script>
```

## Revert
Remove the `.jtl-pen` div and the four CSS lines from the embed, delete the footer script line, publish.
