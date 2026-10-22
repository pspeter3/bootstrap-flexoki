import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { HUES, SHADES, stop } from "../scripts/palette.ts";

const REMOVED_HUES = ["indigo", "violet", "pink", "amber", "lime", "teal", "brown", "pewter"];
const THEME_COLORS: Record<string, string> = {
  primary: "blue",
  accent: "purple",
  success: "green",
  danger: "red",
  warning: "orange",
  info: "cyan",
};

// Flexoki's recommended shades fall just short of WCAG AA (4.5:1) here. Each
// entry is the lowest ratio the pairing is allowed to reach.
const CONTRAST_EXCEPTIONS: Record<string, number> = {
  "light success-contrast on success-bg": 4.39,
  "light info-contrast on info-bg": 4.43,
  "light success-fg on bg-body": 4.39,
  "light info-fg on bg-body": 4.43,
  "dark danger-contrast on danger-bg": 4.42,
  "dark danger-fg on bg-body": 4.42,
};

type Mode = "light" | "dark";

// Tests run against the build output, after PostCSS adds the --bs- prefix.
const theme = await readFile("dist/bootstrap-flexoki.css", "utf8");
const palette = await readFile("dist/flexoki.css", "utf8");
const tokens: Record<string, string> = Object.fromEntries(
  [
    ...(await readFile("src/_tokens.scss", "utf8")).matchAll(/^\$([a-z0-9-]+): (#[0-9a-f]{6});$/gm),
  ].map(([, name, value]) => [name, value]),
);

// The first declaration of each custom property, which for colors is :root. The --bs-
// prefix is dropped so tests can use the names from Bootstrap's Sass.
const properties: Record<string, string> = {};
for (const [, name, value] of theme.matchAll(/--bs-([a-z0-9-]+):\s*([^;]+);/g)) {
  properties[`--${name}`] ??= value.replaceAll("var(--bs-", "var(--").trim();
}

function splitArguments(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "(") depth++;
    if (value[i] === ")") depth--;
    if (value[i] === "," && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  return [...parts, value.slice(start).trim()];
}

// Resolves a custom property to a hex color for one color scheme.
function resolve(value: string, mode: Mode): string {
  value = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toLowerCase();
  }
  const call = value.match(/^([a-z-]+)\((.*)\)$/s);
  if (call?.[1] === "var") {
    const name = splitArguments(call[2])[0];
    assert.ok(name in properties, `${name} is not defined`);
    return resolve(properties[name], mode);
  }
  if (call?.[1] === "light-dark") {
    const [light, dark] = splitArguments(call[2]);
    return resolve(mode === "light" ? light : dark, mode);
  }
  throw new Error(`Cannot resolve ${value}`);
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].toSorted((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

const shortfalls = new Set<string>();

function assertContrast(mode: Mode, foreground: string, background: string): void {
  const label = `${mode} ${foreground} on ${background}`;
  const ratio = contrast(
    resolve(`var(--${foreground})`, mode),
    resolve(`var(--${background})`, mode),
  );
  const minimum = CONTRAST_EXCEPTIONS[label] ?? 4.5;
  if (ratio < 4.5) {
    shortfalls.add(label);
  }
  assert.ok(ratio >= minimum - 0.005, `${label} is ${ratio.toFixed(2)}:1, expected ${minimum}:1`);
}

test("tokens include every Flexoki color", () => {
  assert.equal(Object.keys(tokens).length, 119);
  assert.equal(tokens.paper, "#fffcf0");
  assert.equal(tokens.black, "#100f0f");
  for (const hue of ["base", ...HUES]) {
    for (const shade of SHADES) {
      assert.match(tokens[`${hue}-${shade}`] ?? "", /^#[0-9a-f]{6}$/, `${hue}-${shade}`);
    }
  }
});

test("tokens match stephango.com/flexoki", () => {
  assert.equal(tokens["base-150"], "#dad8ce");
  assert.equal(tokens["red-600"], "#af3029");
  assert.equal(tokens["yellow-400"], "#d0a215");
  assert.equal(tokens["cyan-400"], "#3aa99f");
  assert.equal(tokens["blue-600"], "#205ea6");
  assert.equal(tokens["magenta-950"], "#24131d");
});

test("Bootstrap color tokens use exact Flexoki shades", () => {
  assert.equal(properties["--white"], tokens.paper);
  assert.equal(properties["--black"], tokens.black);
  for (const [hue, source] of [["gray", "base"], ...HUES.map((accent) => [accent, accent])]) {
    for (const shade of SHADES) {
      assert.equal(
        properties[`--${hue}-${stop(shade)}`],
        tokens[`${source}-${shade}`],
        `${hue}-${shade}`,
      );
    }
  }
  assert.equal(properties["--gray-975"], tokens.black);
});

test("custom properties use Bootstrap's --bs- prefix", () => {
  assert.doesNotMatch(theme, /(?<![\w-])--(?!bs-)[a-z][a-z0-9-]*:/);
  assert.doesNotMatch(theme, /var\(--(?!bs-)/);
});

test("Bootstrap hues without a Flexoki counterpart are removed", () => {
  for (const hue of REMOVED_HUES) {
    assert.doesNotMatch(theme, new RegExp(`--${hue}-`), hue);
  }
});

test("theme colors use 600 in light mode and 400 in dark mode", () => {
  for (const [name, hue] of Object.entries(THEME_COLORS)) {
    for (const key of ["base", "fg", "bg"]) {
      assert.equal(
        resolve(`var(--${name}-${key})`, "light"),
        tokens[`${hue}-600`],
        `${name}-${key}`,
      );
      assert.equal(
        resolve(`var(--${name}-${key})`, "dark"),
        tokens[`${hue}-400`],
        `${name}-${key}`,
      );
    }
  }
});

test("surfaces and text follow Flexoki's recommended shades", () => {
  const roles: Record<string, [string, string]> = {
    "bg-body": ["paper", "black"],
    "bg-1": ["base-50", "base-950"],
    "bg-2": ["base-100", "base-900"],
    "bg-3": ["base-150", "base-850"],
    "bg-4": ["base-200", "base-800"],
    "fg-body": ["black", "base-200"],
    "fg-3": ["base-600", "base-500"],
    "fg-4": ["base-300", "base-700"],
    "border-color": ["base-150", "base-850"],
  };
  for (const [name, [light, dark]] of Object.entries(roles)) {
    assert.equal(resolve(`var(--${name})`, "light"), tokens[light], `light ${name}`);
    assert.equal(resolve(`var(--${name})`, "dark"), tokens[dark], `dark ${name}`);
  }
});

test("text meets WCAG AA contrast", () => {
  for (const mode of ["light", "dark"] as const) {
    for (const level of ["body", "1", "2", "3"]) {
      assertContrast(mode, `fg-${level}`, "bg-body");
    }
    for (const name of [...Object.keys(THEME_COLORS), "secondary", "inverse"]) {
      assertContrast(mode, `${name}-contrast`, `${name}-bg`);
      assertContrast(mode, `${name}-fg`, "bg-body");
      assertContrast(mode, `${name}-fg-emphasis`, `${name}-bg-subtle`);
    }
  }
  assert.deepEqual([...shortfalls].toSorted(), Object.keys(CONTRAST_EXCEPTIONS).toSorted());
});

test("palette stylesheet exposes every token", () => {
  const names = [...palette.matchAll(/--flexoki-([a-z0-9-]+): (#[0-9a-f]{6})/g)];
  assert.equal(names.length, 119);
  for (const [, name, value] of names) {
    assert.equal(value, tokens[name], name);
  }
});
