import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import * as cheerio from "cheerio";
import { afterAll, describe, expect, it } from "vitest";

import { checkDirectory } from "../src/core/check.js";

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "smart-links-check-"));

afterAll(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

describe("checkDirectory", () => {
  it("skips links inside elements listed in skipClasses", () => {
    const file = path.join(directory, "index.html");
    fs.writeFileSync(file, `<html><body>
      <div class="not-content"><a href="/missing-skipped">skip</a></div>
      <div><a href="/missing-checked">check</a></div>
      <a href="/">ok</a>
    </body></html>`);

    const result = checkDirectory(directory, {
      routes: new Set(["/"]),
      skipClasses: ["not-content"],
      rewrite: true,
      internalLinkClass: "internal-link",
      brokenLinkClass: "broken-link",
    });

    expect(result.broken.map((entry) => entry.pathname)).toEqual(["/missing-checked"]);

    const $ = cheerio.load(fs.readFileSync(file, "utf8"));
    expect($("a[href=\"/missing-skipped\"]").attr("class")).toBeUndefined();
    expect($("a[href=\"/missing-checked\"]").attr("class")).toContain("broken-link");
  });

  it("checks every link when skipClasses is not set", () => {
    const nested = fs.mkdtempSync(path.join(os.tmpdir(), "smart-links-check-nested-"));
    fs.writeFileSync(path.join(nested, "index.html"), `<html><body>
      <div class="not-content"><a href="/missing">not skipped by default</a></div>
    </body></html>`);

    const result = checkDirectory(nested, { routes: new Set(["/"]) });
    expect(result.broken.map((entry) => entry.pathname)).toEqual(["/missing"]);

    fs.rmSync(nested, { recursive: true, force: true });
  });
});
