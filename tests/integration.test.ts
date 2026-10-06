import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

import { checkDirectory } from "../src/core/check.js";

const require = createRequire(import.meta.url);
const fixtureDir = fileURLToPath(new URL("./fixtures/astro-site", import.meta.url));
const distDir = path.join(fixtureDir, "dist");

function astroBinPath(): string {
  const packageJsonPath = require.resolve("astro/package.json");
  const packageJson = require("astro/package.json") as { bin: string | Record<string, string> };
  const bin = typeof packageJson.bin === "string"
    ? packageJson.bin
    : packageJson.bin.astro;

  return path.join(path.dirname(packageJsonPath), bin);
}

function buildFixture(env: NodeJS.ProcessEnv = {}): void {
  execFileSync(process.execPath, [astroBinPath(), "build"], {
    cwd: fixtureDir,
    stdio: "pipe",
    env: { ...process.env, ...env },
  });
}

describe("smartLinks() integration", () => {
  let homeHtml = "";

  beforeAll(() => {
    rmSync(distDir, { recursive: true, force: true });
    buildFixture();
    homeHtml = readFileSync(path.join(distDir, "index.html"), "utf-8");
  }, 180_000);

  it("styles external links and adds the external icon", () => {
    expect(homeHtml).toContain("external-link");
    expect(homeHtml).toContain("external-icon");
    expect(homeHtml).toContain("target=\"_blank\"");
    expect(homeHtml).toContain("rel=\"noopener noreferrer\"");
  });

  it("keeps valid internal links while marking broken ones", () => {
    const internalHref = homeHtml.match(/<a[^>]*href="\/about"[^>]*class="([^"]*)"/);
    expect(internalHref?.[1] ?? "").toContain("internal-link");

    const brokenHref = homeHtml.match(/<a[^>]*href="\/missing-page"[^>]*class="([^"]*)"/);
    expect(brokenHref?.[1] ?? "").toContain("broken-link");
    expect(brokenHref?.[1] ?? "").not.toContain("internal-link");
  });

  it("resolves relative links against the current page", () => {
    const guideHtml = readFileSync(path.join(distDir, "docs/guide/index.html"), "utf-8");
    const upLink = guideHtml.match(/<a[^>]*href="\.\.\/about"[^>]*class="([^"]*)"/);
    expect(upLink?.[1] ?? "").toContain("internal-link");
  });

  it("ignores anchors, mailto and tel links", () => {
    const anchor = homeHtml.match(/<a[^>]*href="#section"[^>]*>/)?.[0] ?? "";
    expect(anchor).not.toContain("external-link");
    expect(anchor).not.toContain("broken-link");
    expect(anchor).not.toContain("internal-link");

    const mail = homeHtml.match(/<a[^>]*href="mailto:[^"]*"[^>]*>/)?.[0] ?? "";
    expect(mail).not.toContain("external-link");
    expect(mail).not.toContain("target=");
  });

  it("writes a broken link report", () => {
    const reportPath = path.join(fixtureDir, "smart-links-report.json");
    expect(existsSync(reportPath)).toBe(true);

    const report = JSON.parse(readFileSync(reportPath, "utf-8"));
    const paths = report.broken.map((entry: { pathname: string }) => entry.pathname);
    expect(paths).toContain("/missing-page");
    expect(paths).toContain("/docs/nope");
  });

  it("fails the build when failOnBroken is enabled", () => {
    expect(() => buildFixture({ SMART_LINKS_FAIL_ON_BROKEN: "1" })).toThrow();
  }, 180_000);

  it("exposes checkDirectory for CLI usage", () => {
    const { broken, routes } = checkDirectory(distDir, { rewrite: false });
    expect(routes.has("/about")).toBe(true);
    const paths = broken.map((entry) => entry.pathname);
    expect(paths).toContain("/missing-page");
  });
});
