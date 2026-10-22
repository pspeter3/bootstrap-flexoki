// Builds dist/bootstrap-flexoki.css, which overrides Bootstrap's compiled CSS, and
// dist/flexoki.css, the palette on its own.
//
// Usage: node scripts/build.ts
// The theme and stock Bootstrap are compiled from Sass the same way, and only the
// declarations that differ are kept. Every difference must be a custom property, so
// loading the result after Bootstrap's own CSS matches compiling the theme from Sass.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import postcss, { type ChildNode, type Container, type Root } from "postcss";
import prefixCustomProperties from "postcss-prefix-custom-properties";
import * as sass from "sass";
import { declarationKey as key } from "./css.ts";

const OUTPUT = new URL("../dist/", import.meta.url);
const { version } = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const banner = (description: string): string => `/*!
 * bootstrap-flexoki v${version} (https://github.com/pspeter3/bootstrap-flexoki)
 * ${description}
 * Licensed under MIT. Flexoki (https://stephango.com/flexoki) is copyright (c) 2023
 * Steph Ango and released under the MIT License.
 */
`;

function compile(path: string): string {
  return sass.compile(path, { loadPaths: ["node_modules"], quietDeps: true }).css;
}

// Compiles Bootstrap with its --bs- prefix, which its own build adds with PostCSS.
async function compileBootstrap(path: string): Promise<Root> {
  const result = await postcss([prefixCustomProperties({ prefix: "bs-" })]).process(compile(path), {
    from: undefined,
  });
  return result.root;
}

// The values of every declaration with each key, in order.
function values(root: Root): Map<string, string[]> {
  const result = new Map<string, string[]>();
  root.walkDecls((declaration) => {
    const id = key(declaration);
    result.set(id, [...(result.get(id) ?? []), declaration.value]);
  });
  return result;
}

function removeEmpty(container: Container): void {
  for (const node of [...(container.nodes ?? [])] as ChildNode[]) {
    if ("nodes" in node && node.nodes) {
      removeEmpty(node);
      if (node.nodes.length === 0) {
        node.remove();
      }
    }
  }
}

// Removes everything the theme shares with stock Bootstrap.
function override(theme: Root, bootstrap: Root): Root {
  const stock = values(bootstrap);
  const themed = values(theme);
  const unexpected = [
    ...[...themed].filter(([id, list]) => String(stock.get(id)) !== String(list)),
    ...[...stock].filter(([id]) => !themed.has(id)),
  ]
    .map(([id]) => id)
    .filter((id) => !id.split(" > ").at(-1)?.startsWith("--"));
  if (unexpected.length > 0) {
    throw new Error(`The theme changes more than custom properties:\n${unexpected.join("\n")}`);
  }

  const result = theme.clone();
  result.walkDecls((declaration) => {
    if (String(stock.get(key(declaration))) === String(themed.get(key(declaration)))) {
      declaration.remove();
    }
  });
  result.walkComments((comment) => {
    comment.remove();
  });
  result.walkAtRules((rule) => {
    // The charset and Bootstrap's layer order come from Bootstrap's CSS.
    if (rule.name === "charset" || (rule.name === "layer" && !rule.nodes)) {
      rule.remove();
    }
  });
  removeEmpty(result);
  return result;
}

const [theme, bootstrap] = await Promise.all([
  compileBootstrap("src/bootstrap-flexoki.scss"),
  compileBootstrap("node_modules/bootstrap/scss/bootstrap.scss"),
]);
await mkdir(OUTPUT, { recursive: true });
await writeFile(
  new URL("bootstrap-flexoki.css", OUTPUT),
  `${banner("Flexoki theme for Bootstrap. Load after Bootstrap's CSS.")}${override(theme, bootstrap).toString().trim()}\n`,
);
await writeFile(
  new URL("flexoki.css", OUTPUT),
  `${banner("The Flexoki palette as custom properties.")}${compile("src/flexoki.scss").trim()}\n`,
);
