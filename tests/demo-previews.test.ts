import type { Element, Root } from "hast";
import type { SmartLinksOptions } from "rehype-smart-links";

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

import * as cheerio from "cheerio";
import rehypeParse from "rehype-parse";
import { rehypeSmartLinks } from "rehype-smart-links";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { h } = require("hastscript") as { h: (...args: unknown[]) => Element };

const docsDir = path.join(process.cwd(), "example/src/content/docs");

interface Section {
  title: string;
  internal: string;
  external: string;
  broken: string;
  snippet: string;
}

interface AnchorShape {
  tag?: string;
  attrs: Record<string, string>;
  classes: string[];
  children: unknown[];
}

function collectFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory())
      files.push(...collectFiles(full));
    else if (entry.name.endsWith(".mdx"))
      files.push(full);
  }
  return files;
}

function extractSections(source: string): Section[] {
  const sections: Section[] = [];
  let current: Section | undefined;
  let inFence = false;
  let fenceLang = "";
  let fenceLines: string[] = [];

  for (const line of source.split("\n")) {
    if (current) {
      if (line.startsWith("```")) {
        if (inFence) {
          if (fenceLang === "js" && !current.snippet)
            current.snippet = fenceLines.join("\n");
          inFence = false;
          fenceLines = [];
        }
        else {
          inFence = true;
          fenceLang = line.slice(3).trim();
        }
        continue;
      }
      if (inFence) {
        fenceLines.push(line);
        continue;
      }
      const propMatch = line.trim().match(/^(internalLinkHtml|externalLinkHtml|brokenLinkHtml)='(.*)'$/);
      if (propMatch) {
        const key = propMatch[1] === "internalLinkHtml"
          ? "internal"
          : propMatch[1] === "externalLinkHtml" ? "external" : "broken";
        current[key] = propMatch[2];
      }
      else if (line.includes("</CodeExample>")) {
        sections.push(current);
        current = undefined;
      }
      continue;
    }
    if (line.includes("<CodeExample"))
      current = { title: "", internal: "", external: "", broken: "", snippet: "" };
  }
  return sections;
}

function extractOptions(snippet: string): SmartLinksOptions | undefined {
  if (!snippet.includes("smartLinks("))
    return undefined;

  const stripped = snippet
    .split("\n")
    .filter((line) => !/^\s*import\s/.test(line))
    .join("\n")
    .replace(/export default /g, "")
    .replace(/,\s*$/, "");

  let captured: SmartLinksOptions | undefined;
  const sandbox = {
    smartLinks: (options: SmartLinksOptions) => {
      captured = options;
      return options;
    },
    defineConfig: (config: unknown) => config,
    h,
  };
  // The snippets are trusted repository content; evaluate them to capture the
  // options object exactly as a user would pass it to `smartLinks()`.
  // eslint-disable-next-line no-new-func
  const fn = new Function(...Object.keys(sandbox), `${stripped}\n;`);
  fn(...Object.values(sandbox));
  return captured;
}

interface CheerioNode {
  type?: string;
  name?: string;
  data?: string;
  attribs?: Record<string, string>;
  children?: CheerioNode[];
}

function anchorShape(html: string): AnchorShape | undefined {
  const $ = cheerio.load(html, null, false);
  const root = $.root().children().first();
  const el = root.get(0) as CheerioNode | undefined;
  if (!el)
    return undefined;

  const attrs = { ...root.attr() };
  delete attrs.href;
  const classes = (attrs.class ?? "").split(/\s+/).filter(Boolean).sort();
  delete attrs.class;

  const children: unknown[] = [];
  const walk = (node: CheerioNode): void => {
    for (const child of node.children ?? []) {
      if (child.type === "text") {
        if (child.data?.trim())
          children.push({ text: true });
        continue;
      }
      if (child.type === "comment")
        continue;
      const childAttrs = { ...child.attribs };
      delete childAttrs.href;
      const childClasses = (childAttrs.class ?? "").split(/\s+/).filter(Boolean).sort();
      delete childAttrs.class;
      children.push({ tag: child.name, classes: childClasses, attrs: childAttrs });
      walk(child);
    }
  };
  walk(el);

  return { tag: el.name, attrs, classes, children };
}

function hrefOf(html: string): string | undefined {
  const $ = cheerio.load(html, null, false);
  return $.root().find("a").first().attr("href");
}

function diffAnchors(name: string, preview: string, actual: string): string[] {
  const expected = anchorShape(preview);
  const got = anchorShape(actual);
  if (!expected || !got)
    return [`${name}: could not parse anchors`];

  const details: string[] = [];
  const missing = expected.classes.filter((cls) => !got.classes.includes(cls));
  const extra = got.classes.filter((cls) => !expected.classes.includes(cls));
  if (missing.length)
    details.push(`missing classes [${missing.join(" ")}]`);
  if (extra.length)
    details.push(`extra classes [${extra.join(" ")}]`);
  for (const key of Object.keys(expected.attrs)) {
    if ((expected.attrs[key] ?? "") !== (got.attrs[key] ?? ""))
      details.push(`attr ${key}: preview=${expected.attrs[key] ?? "-"} actual=${got.attrs[key] ?? "-"}`);
  }
  for (const key of Object.keys(got.attrs)) {
    if (!(key in expected.attrs))
      details.push(`extra attr ${key}=${got.attrs[key]}`);
  }
  if (JSON.stringify(expected.children) !== JSON.stringify(got.children)) {
    details.push(
      `children differ\n      preview: ${JSON.stringify(expected.children).slice(0, 200)}\n      actual : ${JSON.stringify(got.children).slice(0, 200)}`,
    );
  }
  return details.length ? [`${name}: ${details.join("; ")}`] : [];
}

describe("example demo previews", () => {
  it("match the documented configuration snippets", async () => {
    const mismatches: string[] = [];
    let checked = 0;

    for (const file of collectFiles(docsDir)) {
      const relative = path.relative(process.cwd(), file);
      for (const section of extractSections(fs.readFileSync(file, "utf8"))) {
        const options = extractOptions(section.snippet);
        if (!options)
          continue;

        checked++;
        const hrefs = {
          internal: hrefOf(section.internal),
          external: hrefOf(section.external),
          broken: hrefOf(section.broken),
        };
        const input = `<html><body><div id="i"><a href="${hrefs.internal}">Internal</a></div><div id="e"><a href="${hrefs.external}">External</a></div><div id="b"><a href="${hrefs.broken}">Broken</a></div></body></html>`;

        let output: string;
        try {
          output = String(await unified()
            .use(rehypeParse)
            .use(rehypeSmartLinks, {
              ...options,
              routes: ["/about", "/en/about", "/demo/basic", "/en/demo/basic", "/"],
              logger: false,
            })
            .use(rehypeStringify)
            .process(input));
        }
        catch (error) {
          mismatches.push(`${relative} :: ${section.title}: ERROR ${(error as Error).message}`);
          continue;
        }

        const $ = cheerio.load(output);
        const actual = {
          internal: $.html($("#i").children().first()),
          external: $.html($("#e").children().first()),
          broken: $.html($("#b").children().first()),
        };

        const sectionDiffs = [
          ...diffAnchors("internal", section.internal, actual.internal),
          ...diffAnchors("external", section.external, actual.external),
          ...diffAnchors("broken", section.broken, actual.broken),
        ];
        if (sectionDiffs.length)
          mismatches.push(`${relative} :: ${section.title}\n  ${sectionDiffs.join("\n  ")}`);
      }
    }

    expect(checked).toBeGreaterThan(0);
    expect(mismatches.join("\n\n")).toBe("");
  });

  it("documents a runnable snippet for every demo", async () => {
    const allSections: { file: string; section: Section }[] = [];
    for (const file of collectFiles(docsDir)) {
      for (const section of extractSections(fs.readFileSync(file, "utf8")))
        allSections.push({ file: path.relative(process.cwd(), file), section });
    }

    const missing = allSections
      .filter(({ section }) => !section.snippet.includes("smartLinks("))
      .map(({ file, section }) => `${file} :: ${section.title}`);

    expect(missing.join("\n")).toBe("");
    void (null as unknown as Root);
  });
});
