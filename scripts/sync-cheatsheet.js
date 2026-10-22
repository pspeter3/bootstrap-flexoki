// Downloads Bootstrap's cheatsheet example into demo/ and points it at this theme.
//
// Usage: node scripts/sync-cheatsheet.js
// The published 6.0 docs match the cheatsheet built from the v6.0.0-alpha.1 tag. Check
// that's still true before syncing after Bootstrap releases another 6.0 alpha.
import { mkdir, writeFile } from "node:fs/promises";

const BASE = "https://getbootstrap.com/docs/6.0";
const PAGE = `${BASE}/examples/cheatsheet/`;
const OUTPUT = new URL("../demo/", import.meta.url);
const NOTICE =
  `Bootstrap's cheatsheet example (${PAGE}), copyright the Bootstrap Authors and ` +
  "licensed under CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/). " +
  "Modified by scripts/sync-cheatsheet.js to use bootstrap-flexoki. Do not edit by hand.";

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  return response.text();
}

// Replaces every match, failing if there are none so upstream changes aren't missed.
function rewrite(html, pattern, replacement) {
  if (typeof pattern === "string" ? !html.includes(pattern) : !pattern.test(html)) {
    throw new Error(`Cheatsheet no longer contains ${pattern}`);
  }
  return typeof pattern === "string"
    ? html.replaceAll(pattern, replacement)
    : html.replace(pattern, replacement);
}

const rewrites = [
  ["/docs/6.0/dist/css/bootstrap.min.css", "../dist/bootstrap-flexoki.css"],
  [
    "/docs/6.0/dist/js/bootstrap.bundle.min.js",
    "../node_modules/bootstrap/dist/js/bootstrap.bundle.min.js",
  ],
  ["/docs/6.0/examples/cheatsheet/", ""],
  ["/docs/6.0/assets/js/color-modes.js", "color-modes.js"],
  ["<title>Cheatsheet · Bootstrap v6.0</title>", "<title>Cheatsheet · Bootstrap Flexoki</title>"],
  // Favicons, the canonical link and the theme color belong to getbootstrap.com.
  [/<link rel="(?:canonical|apple-touch-icon|icon|manifest|mask-icon)"[^>]*>/g, ""],
  [/<meta name="theme-color"[^>]*>/g, ""],
  // Leave out the Bootstrap logo.
  [/(<a class="navbar-brand" href="#">)\s*<img [^>]*bootstrap-logo-white\.svg[^>]*>/g, "$1Navbar"],
  [/<img [^>]*bootstrap-logo-white\.svg[^>]*>/g, ""],
  // Link the remaining docs references to getbootstrap.com.
  [/(href|src)="\/docs\/6\.0\//g, `$1="${BASE}/`],
  ["<!DOCTYPE html>", `<!DOCTYPE html>\n<!-- ${NOTICE} -->\n`],
];

let html = await download(PAGE);
for (const [pattern, replacement] of rewrites) {
  html = rewrite(html, pattern, replacement);
}

const files = {
  "index.html": html,
  "cheatsheet.css": `/* ${NOTICE} */\n${await download(`${PAGE}cheatsheet.css`)}`,
  "cheatsheet.js": `/* ${NOTICE} */\n${await download(`${PAGE}cheatsheet.js`)}`,
  "color-modes.js": await download(`${BASE}/assets/js/color-modes.js`),
};

await mkdir(OUTPUT, { recursive: true });
for (const [name, contents] of Object.entries(files)) {
  await writeFile(new URL(name, OUTPUT), contents);
}
console.log(`Wrote Bootstrap's cheatsheet to demo/`);
