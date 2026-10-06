import type { Element, Root } from "hast";
import type { VFile } from "vfile";

import type { LinkMeta, LinkRecord, ResolvedSmartLinksOptions } from "../types.js";
import { visit } from "unist-util-visit";

import { classifyHref } from "./classify.js";
import { addClass, createContentElement, removeClass } from "./hast.js";

export interface TransformContext {
  options: ResolvedSmartLinksOptions;
  routes?: Set<string>;
  pagePath?: string;
}

export interface TransformResult {
  counts: Record<"internal" | "external" | "broken", number>;
  records: LinkRecord[];
}

/**
 * Derives the route of the page that is currently being rendered from the
 * absolute path of its source file.
 */
export function getPagePath(file: VFile | undefined, pagesDir?: string): string | undefined {
  if (!pagesDir)
    return undefined;

  const filePath = file?.path ?? file?.history?.[0];
  if (!filePath)
    return undefined;

  const normalizedPagesDir = pagesDir.replace(/[\\/]+$/, "");
  if (!filePath.startsWith(normalizedPagesDir))
    return undefined;

  let relativePath = filePath
    .slice(normalizedPagesDir.length)
    .replace(/^[\\/]+/, "")
    .replace(/\\/g, "/");

  relativePath = relativePath.replace(/\.(?:md|mdx|markdown|html)$/i, "");
  relativePath = relativePath.replace(/(?:^|\/)index$/i, "");

  return relativePath ? `/${relativePath}` : "/";
}

function replaceNode(
  parent: Element | Root | undefined,
  index: number | undefined,
  node: Element,
  replacement: Element,
): Element {
  if (replacement !== node && parent && typeof index === "number")
    parent.children[index] = replacement;

  return replacement;
}

function applyWrapper(
  node: Element,
  type: "internal" | "external" | "broken",
  className: string,
  meta: LinkMeta,
  options: ResolvedSmartLinksOptions,
  parent: Element | Root | undefined,
  index: number | undefined,
): void {
  if (!options.wrapperTemplate)
    return;

  const result = options.wrapperTemplate(node, type, meta);
  if (result && result !== node)
    replaceNode(parent, index, node, result);
}

export function transformTree(
  tree: Root,
  file: VFile | undefined,
  context: TransformContext,
): TransformResult {
  const { options, routes } = context;
  const pagePath = context.pagePath ?? getPagePath(file, options.pagesDir);
  const sourceFile = file?.path ?? file?.history?.[0];
  const counts = { internal: 0, external: 0, broken: 0 };
  const records: LinkRecord[] = [];

  visit(tree, "element", (node: Element, index, parent) => {
    if (node.tagName !== "a" || !node.properties)
      return;

    const href = node.properties.href;
    if (typeof href !== "string" || href.length === 0)
      return;

    const classified = classifyHref(href, {
      base: options.base,
      pagePath,
      routes,
      ignore: options.ignore,
    });

    if (classified.type === "ignored")
      return;

    const type = classified.type;
    const className = type === "internal"
      ? options.internalLinkClass
      : type === "external"
        ? options.externalLinkClass
        : options.brokenLinkClass;

    const meta: LinkMeta = {
      href,
      pathname: classified.pathname,
      className,
      sourceFile,
    };

    counts[type]++;
    const record: LinkRecord = { type, href, pathname: classified.pathname, sourceFile };
    records.push(record);
    options.onLink?.(record);

    if (type === "external") {
      if (options.customExternalLinkTransform) {
        options.customExternalLinkTransform(node, meta);
        return;
      }

      if (options.target)
        node.properties.target = options.target;
      if (options.rel)
        node.properties.rel = options.rel;

      if (options.wrapperTemplate) {
        applyWrapper(node, "external", options.externalLinkClass, meta, options, parent, index);
        return;
      }

      addClass(node, options.externalLinkClass);
      if (options.content)
        node.children.push(createContentElement(options.contentClass, options.content.value));

      return;
    }

    if (type === "internal") {
      if (options.customInternalLinkTransform) {
        options.customInternalLinkTransform(node, meta);
        return;
      }

      if (options.wrapperTemplate) {
        applyWrapper(node, "internal", options.internalLinkClass, meta, options, parent, index);
        return;
      }

      addClass(node, options.internalLinkClass);
      return;
    }

    // broken
    if (options.customBrokenLinkTransform) {
      options.customBrokenLinkTransform(node, meta);
      return;
    }

    if (options.wrapperTemplate) {
      applyWrapper(node, "broken", options.brokenLinkClass, meta, options, parent, index);
      return;
    }

    removeClass(node, options.internalLinkClass);
    addClass(node, options.brokenLinkClass);
  });

  return { counts, records };
}
