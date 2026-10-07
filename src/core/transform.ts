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
  sourceFile?: string;
}

export interface LinkTransformHooks {
  replace: (node: Element, replacement: Element) => void;
  appendChild: (node: Element, child: Element) => void;
}

export interface TransformResult {
  counts: Record<"internal" | "external" | "broken", number>;
  records: LinkRecord[];
}

/**
 * Derives the route of a page from the absolute path of its source file.
 */
export function getPagePath(filePath: string | undefined, pagesDir?: string): string | undefined {
  if (!pagesDir || !filePath)
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

/**
 * Transforms a single anchor element. Shared by the unified rehype plugin and
 * the Sätteri hast plugin.
 */
export function transformAnchor(
  node: Element,
  href: string,
  context: TransformContext,
  hooks: LinkTransformHooks,
): LinkRecord | undefined {
  const { options, routes } = context;

  const classified = classifyHref(href, {
    base: options.base,
    pagePath: context.pagePath,
    routes,
    ignore: options.ignore,
  });

  if (classified.type === "ignored")
    return undefined;

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
    sourceFile: context.sourceFile,
  };

  const record: LinkRecord = {
    type,
    href,
    pathname: classified.pathname,
    sourceFile: context.sourceFile,
  };

  options.onLink?.(record);

  const applyWrapper = (): boolean => {
    if (!options.wrapperTemplate)
      return false;

    const result = options.wrapperTemplate(node, type, meta);
    if (result && result !== node)
      hooks.replace(node, result);

    return true;
  };

  if (type === "external") {
    if (options.customExternalLinkTransform) {
      options.customExternalLinkTransform(node, meta);
      return record;
    }

    if (options.target)
      node.properties.target = options.target;
    if (options.rel)
      node.properties.rel = options.rel;

    if (applyWrapper())
      return record;

    addClass(node, options.externalLinkClass);
    if (options.content)
      hooks.appendChild(node, createContentElement(options.contentClass, options.content.value));

    return record;
  }

  if (type === "internal") {
    if (options.customInternalLinkTransform) {
      options.customInternalLinkTransform(node, meta);
      return record;
    }

    if (applyWrapper())
      return record;

    addClass(node, options.internalLinkClass);
    return record;
  }

  // broken
  if (options.customBrokenLinkTransform) {
    options.customBrokenLinkTransform(node, meta);
    return record;
  }

  if (applyWrapper())
    return record;

  removeClass(node, options.internalLinkClass);
  addClass(node, options.brokenLinkClass);
  return record;
}

export function transformTree(
  tree: Root,
  file: VFile | undefined,
  context: TransformContext,
): TransformResult {
  const sourceFile = context.sourceFile ?? file?.path ?? file?.history?.[0];
  const pagePath = context.pagePath ?? getPagePath(sourceFile, context.options.pagesDir);
  const counts = { internal: 0, external: 0, broken: 0 };
  const records: LinkRecord[] = [];

  visit(tree, "element", (node: Element, index, parent) => {
    if (node.tagName !== "a" || !node.properties)
      return;

    const href = node.properties.href;
    if (typeof href !== "string" || href.length === 0)
      return;

    const record = transformAnchor(
      node,
      href,
      { ...context, pagePath, sourceFile },
      {
        replace: (_target, replacement) => {
          if (parent && typeof index === "number")
            parent.children[index] = replacement;
        },
        appendChild: (target, child) => {
          target.children.push(child);
        },
      },
    );

    if (record) {
      counts[record.type]++;
      records.push(record);
    }
  });

  return { counts, records };
}
