import type { Element, RootContent } from "hast";

import type { ResolvedSmartLinksOptions } from "../types.js";

import { fileURLToPath } from "node:url";
import { getPagePath, transformAnchor } from "./transform.js";

interface SatteriFactoryContext {
  fileURL?: URL;
}

interface SatteriVisitorContext {
  replaceNode: (node: Element, replacement: Element) => void;
}

type HastNode = RootContent | Element;

/**
 * Sätteri materializes the tree and requires mutations to go through its
 * visitor context, so we run the shared transform on a throwaway copy and
 * replace the original node with the result.
 */
function cloneHastNode<T extends HastNode>(node: T): T {
  const clone: Record<string, unknown> = { ...node };

  if (Array.isArray(clone.children))
    clone.children = (clone.children as HastNode[]).map((child) => cloneHastNode(child));

  if (clone.properties && typeof clone.properties === "object")
    clone.properties = { ...(clone.properties as Record<string, unknown>) };

  return clone as T;
}

/**
 * Adapter that runs the link transform as a Sätteri hast plugin, the default
 * Markdown processor in Astro 7+.
 */
export function satteriSmartLinksPlugin(options: ResolvedSmartLinksOptions, routes?: Set<string>) {
  return ({ fileURL }: SatteriFactoryContext) => {
    const sourceFile = fileURL ? fileURLToPath(fileURL) : undefined;
    const pagePath = getPagePath(sourceFile, options.pagesDir);

    return {
      name: "astro-smart-links",
      element: {
        filter: ["a"],
        visit: (node: Element, ctx: SatteriVisitorContext): void => {
          const href = node.properties?.href;
          if (typeof href !== "string" || href.length === 0)
            return;

          const clone = cloneHastNode(node);
          let result: Element = clone;

          transformAnchor(
            clone,
            href,
            { options, routes, pagePath, sourceFile },
            {
              replace: (_target, replacement) => {
                result = replacement;
              },
              appendChild: (target, child) => {
                target.children.push(child);
              },
            },
          );

          if (result !== node)
            ctx.replaceNode(node, result);
        },
      },
    };
  };
}
