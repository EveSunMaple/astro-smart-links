import type { Element, Root } from "hast";

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

import { classifyHref } from "./classify.js";
import { addClass, removeClass } from "./hast.js";
import { normalizeRoute } from "./normalize.js";
import { scanRoutes, type ScanRoutesOptions } from "./routes.js";

export interface BrokenAnchor {
  href: string;
  pathname: string;
  /** Absolute path of the HTML file the link was found in. */
  sourceFile: string;
}

export interface CheckDirectoryOptions extends ScanRoutesOptions {
  /** Known routes. When omitted, routes are collected by scanning the directory. */
  routes?: Set<string>;
  ignore?: (string | RegExp)[];
  /**
   * Links inside elements carrying one of these classes are skipped entirely:
   * they are not checked and never rewritten. Useful for component or demo
   * markup that opts out of content styles (e.g. Starlight's `not-content`).
   */
  skipClasses?: string[];
  /** Rewrite generated HTML so broken links receive `brokenLinkClass`. */
  rewrite?: boolean;
  internalLinkClass?: string;
  brokenLinkClass?: string;
}

export interface CheckDirectoryResult {
  routes: Set<string>;
  broken: BrokenAnchor[];
  checkedLinks: number;
}

export function collectHtmlFiles(directory: string): string[] {
  const files: string[] = [];

  const walk = (currentDir: string): void => {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory())
        walk(fullPath);
      else if (entry.isFile() && entry.name.endsWith(".html"))
        files.push(fullPath);
    }
  };

  walk(directory);
  return files;
}

export function routeFromHtmlFile(distDir: string, htmlFile: string): string {
  let relativePath = relative(distDir, htmlFile).replace(/\\/g, "/");
  relativePath = relativePath.replace(/\.html$/i, "");
  relativePath = relativePath.replace(/(?:^|\/)index$/i, "");
  return normalizeRoute(relativePath);
}

function hasAnyClass(node: Element, classes: string[]): boolean {
  const current = node.properties?.className;
  const list = Array.isArray(current)
    ? current.map(String)
    : typeof current === "string" ? current.split(/\s+/) : [];

  return classes.some((className) => list.includes(className));
}

export function checkDirectory(directory: string, options: CheckDirectoryOptions = {}): CheckDirectoryResult {
  const routes = options.routes
    ?? scanRoutes(directory, options);
  const skipClasses = options.skipClasses ?? [];
  const broken: BrokenAnchor[] = [];
  let checkedLinks = 0;

  for (const htmlFile of collectHtmlFiles(directory)) {
    const source = readFileSync(htmlFile, "utf-8");
    if (!source.includes("<a"))
      continue;

    const processor = unified().use(rehypeParse).use(rehypeStringify);
    const tree = processor.parse(source) as Root;
    const pagePath = routeFromHtmlFile(directory, htmlFile);
    let changed = false;

    const walk = (parent: Root | Element, insideSkipped: boolean): void => {
      for (const child of parent.children) {
        if (child.type !== "element")
          continue;

        const skipped = insideSkipped
          || (skipClasses.length > 0 && hasAnyClass(child, skipClasses));

        if (child.tagName === "a" && !skipped && child.properties) {
          const href = child.properties.href;
          if (typeof href === "string" && href.length > 0) {
            const classified = classifyHref(href, {
              base: options.base,
              routes,
              ignore: options.ignore,
              pagePath,
            });

            if (classified.type !== "ignored") {
              checkedLinks++;

              if (classified.type === "broken") {
                broken.push({ href, pathname: classified.pathname ?? href, sourceFile: htmlFile });

                if (options.rewrite) {
                  removeClass(child, options.internalLinkClass);
                  addClass(child, options.brokenLinkClass);
                  changed = true;
                }
              }
            }
          }
        }

        walk(child, skipped);
      }
    };

    walk(tree, false);

    if (changed)
      writeFileSync(htmlFile, processor.stringify(tree));
  }

  return { routes, broken, checkedLinks };
}
