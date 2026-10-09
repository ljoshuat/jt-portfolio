# Site footer bundle

`site-bundle.min.js` replaces the 22 separate custom script tags and the inline MENU script
in Webflow's site footer with one request. Order and code are unchanged: the build copies
each file at the exact commit the footer used to load (see `manifest.txt`).

## Changing a script

1. Edit and push the script as usual (e.g. `head-tilt.js`).
2. In `manifest.txt`, set that file's line to the new commit SHA.
3. Rebuild and minify from the repo root:

   ```
   node bundle/build.mjs
   npx terser@5 site-bundle.js --compress pure_getters=false --mangle --comments false -o site-bundle.min.js
   ```

   (`pure_getters=false` keeps the `void el.offsetWidth` reflow tricks.)
4. Commit, push, and swap the SHA in the footer's `site-bundle.min.js` tag.

To add a new script, add its line in `manifest.txt` where it should run (before
`page-transition.js`, which stays last). If it is wrapped in an IIFE, add it to `WRAP` in
`build.mjs` so an error in it can't stop the scripts after it.
