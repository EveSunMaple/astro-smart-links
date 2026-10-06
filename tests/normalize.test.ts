import { describe, expect, it } from "vitest";

import { classifyHref } from "../src/core/classify.js";
import { isExternalHref, isIgnoredHref, normalizeBase, normalizeRoute, resolveInternalHref } from "../src/core/normalize.js";

describe("normalizeRoute", () => {
  it("normalizes trailing slashes and index files", () => {
    expect(normalizeRoute("/about/")).toBe("/about");
    expect(normalizeRoute("/about/index.html")).toBe("/about");
    expect(normalizeRoute("/about/index")).toBe("/about");
    expect(normalizeRoute("about")).toBe("/about");
    expect(normalizeRoute("/")).toBe("/");
    expect(normalizeRoute("")).toBe("/");
  });

  it("strips query strings, hashes and the base path", () => {
    expect(normalizeRoute("/about?page=1#team")).toBe("/about");
    expect(normalizeRoute("/docs/about", "/docs")).toBe("/about");
    expect(normalizeRoute("/docs", "/docs")).toBe("/");
    expect(normalizeRoute("/docs/", "/docs/")).toBe("/");
  });

  it("normalizes the base path", () => {
    expect(normalizeBase("/docs/")).toBe("/docs");
    expect(normalizeBase("docs")).toBe("/docs");
    expect(normalizeBase("/")).toBe("");
    expect(normalizeBase(undefined)).toBe("");
  });
});

describe("href classification helpers", () => {
  it("detects external hrefs", () => {
    expect(isExternalHref("https://example.com")).toBe(true);
    expect(isExternalHref("http://example.com")).toBe(true);
    expect(isExternalHref("//example.com")).toBe(true);
    expect(isExternalHref("/about")).toBe(false);
    expect(isExternalHref("mailto:a@b.c")).toBe(false);
  });

  it("detects ignored hrefs", () => {
    expect(isIgnoredHref("#section")).toBe(true);
    expect(isIgnoredHref("")).toBe(true);
    expect(isIgnoredHref("mailto:a@b.c")).toBe(true);
    expect(isIgnoredHref("tel:+123")).toBe(true);
    expect(isIgnoredHref("javascript:void(0)")).toBe(true);
    expect(isIgnoredHref("/about")).toBe(false);
    expect(isIgnoredHref("https://example.com")).toBe(false);
  });
});

describe("resolveInternalHref", () => {
  it("resolves relative links against the page route", () => {
    expect(resolveInternalHref("./about", "/docs/guide")).toBe("/docs/about");
    expect(resolveInternalHref("../about", "/docs/guide")).toBe("/about");
    expect(resolveInternalHref("./about", "/")).toBe("/about");
    expect(resolveInternalHref("/about", "/docs/guide")).toBe("/about");
  });
});

describe("classifyHref", () => {
  it("classifies external, internal, broken and ignored links", () => {
    expect(classifyHref("https://example.com").type).toBe("external");
    expect(classifyHref("#top").type).toBe("ignored");
    expect(classifyHref("mailto:a@b.c").type).toBe("ignored");
    expect(classifyHref("/about").type).toBe("internal");
    expect(classifyHref("/missing", { routes: new Set(["/", "/about"]) }).type).toBe("broken");
    expect(classifyHref("/about", { routes: new Set(["/", "/about"]) }).type).toBe("internal");
  });

  it("supports base paths and page-relative resolution", () => {
    const routes = new Set(["/", "/about"]);
    expect(classifyHref("/docs/about", { base: "/docs", routes }).type).toBe("internal");
    expect(classifyHref("../about", { pagePath: "/docs/guide", routes }).pathname).toBe("/about");
  });

  it("honours the ignore list", () => {
    expect(classifyHref("/draft", { ignore: ["/draft"] }).type).toBe("ignored");
    expect(classifyHref("/draft/a", { ignore: [/^\/draft/] }).type).toBe("ignored");
  });

  it("treats every internal link as valid without a route set", () => {
    expect(classifyHref("/anything").type).toBe("internal");
  });
});
