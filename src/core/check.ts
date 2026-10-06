import type { Root } from "hast";

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";

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

export function checkDirectory(directory: string, options: CheckDirectoryOptions = {}): CheckDirectoryResult {
  const routes = options.routes
    ?? scanRoutes(directory, options);
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

    visit(tree, "element", (node) => {
      if (node.tagName !== "a" || !node.properties)
        return;

      const href = node.properties.href;
      if (typeof href !== "string" || href.length === 0)
        return;

      const classified = classifyHref(href, {
        base: options.base,
        routes,
        ignore: options.ignore,
        pagePath,
      });

      if (classified.type === "ignored")
        return;

      checkedLinks++;

      if (classified.type !== "broken")
        return;

      broken.push({ href, pathname: classified.pathname ?? href, sourceFile: htmlFile });

      if (options.rewrite) {
        removeClass(node, options.internalLinkClass);
        addClass(node, options.brokenLinkClass);
        changed = true;
      }
    });

    if (changed)
      writeFileSync(htmlFile, processor.stringify(tree));
  }

  return { routes, broken, checkedLinks };
}
