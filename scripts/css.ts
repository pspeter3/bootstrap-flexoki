// Shared by the build script and the tests.
import type { Declaration } from "postcss";

// Identifies a declaration by its property and the rules and at-rules around it.
export function declarationKey(declaration: Declaration): string {
  const context: string[] = [];
  for (let node = declaration.parent; node && node.type !== "root"; node = node.parent) {
    if (node.type === "rule") {
      context.unshift(node.selector.replaceAll(/\s+/g, " "));
    } else if (node.type === "atrule") {
      context.unshift(`@${node.name} ${node.params}`);
    }
  }
  return [...context, declaration.prop].join(" > ");
}
