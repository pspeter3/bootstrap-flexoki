// Builds the demo site in _site/ from Bootstrap's cheatsheet example and this theme.
//
// Usage: node scripts/build-demo.ts
// Run `npm run build` first. The cheatsheet is downloaded from getbootstrap.com, which must
// publish the same Bootstrap version as the one installed.
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";

const BASE = "https://getbootstrap.com/docs/6.0";
const PAGE = `${BASE}/examples/cheatsheet/`;
const OUTPUT = new URL("../_site/", import.meta.url);
const BOOTSTRAP_JS = new URL("../node_modules/bootstrap/dist/js/", import.meta.url);
const NOTICE =
  `Bootstrap's cheatsheet example (${PAGE}), copyright the Bootstrap Authors and ` +
  "licensed under CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/). " +
  "Modified by scripts/build-demo.ts to use bootstrap-flexoki.";

async function download(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  return response.text();
}

// Replaces every match, failing if there are none so upstream changes aren't missed.
function rewrite(html: string, pattern: string | RegExp, replacement: string): string {
  if (typeof pattern === "string" ? !html.includes(pattern) : !pattern.test(html)) {
    throw new Error(`Cheatsheet no longer contains ${pattern}`);
  }
  return typeof pattern === "string"
    ? html.replaceAll(pattern, replacement)
    : html.replace(pattern, replacement);
}

function version(banner: string): string | undefined {
  return banner.match(/Bootstrap v(\S+)/)?.[1];
}

const installed = version(await readFile(new URL("bootstrap.bundle.min.js", BOOTSTRAP_JS), "utf8"));
const published = version(await download(`${BASE}/dist/js/bootstrap.bundle.min.js`));
if (installed !== published) {
  throw new Error(`getbootstrap.com has Bootstrap ${published}, but ${installed} is installed`);
}

const rewrites: [string | RegExp, string][] = [
  ["/docs/6.0/dist/css/bootstrap.min.css", "bootstrap-flexoki.css"],
  // Import maps need a ./ prefix on relative URLs.
  ["/docs/6.0/dist/js/bootstrap.bundle.min.js", "./bootstrap.bundle.min.js"],
  ["/docs/6.0/examples/cheatsheet/", ""],
  ["/docs/6.0/assets/js/color-modes.js", "color-modes.js"],
  ["<title>Cheatsheet · Bootstrap v6.0</title>", "<title>Bootstrap Flexoki</title>"],
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

const files: Record<string, string> = {
  "index.html": html,
  "cheatsheet.css": `/* ${NOTICE} */\n${await download(`${PAGE}cheatsheet.css`)}`,
  "cheatsheet.js": `/* ${NOTICE} */\n${await download(`${PAGE}cheatsheet.js`)}`,
  "color-modes.js": await download(`${BASE}/assets/js/color-modes.js`),
};

await rm(OUTPUT, { recursive: true, force: true });
await mkdir(OUTPUT, { recursive: true });
for (const [name, contents] of Object.entries(files)) {
  await writeFile(new URL(name, OUTPUT), contents);
}
await copyFile(
  new URL("../dist/bootstrap-flexoki.css", import.meta.url),
  new URL("bootstrap-flexoki.css", OUTPUT),
);
for (const name of ["bootstrap.bundle.min.js", "bootstrap.bundle.min.js.map"]) {
  await copyFile(new URL(name, BOOTSTRAP_JS), new URL(name, OUTPUT));
}
console.log(`Built the demo for Bootstrap ${installed} in _site/`);
