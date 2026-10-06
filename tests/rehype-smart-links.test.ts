import type { TestResult } from "./utils/testRunner";
import path from "node:path";
import process from "node:process";

import { afterAll, describe, expect, it } from "vitest";

import testCases from "./cases/testCases";
import { generateHTMLReport, runTest } from "./utils/testRunner";

function buildDiffMessage(result: TestResult): string {
  const lines = [`Test "${result.title}" (${result.id}) did not match the expected output.`];

  if (result.actualInternal !== result.expectedInternalLinkHtml) {
    lines.push(
      "Internal link:",
      `  expected: ${result.expectedInternalLinkHtml}`,
      `  actual:   ${result.actualInternal}`,
    );
  }

  if (result.actualExternal !== result.expectedExternalLinkHtml) {
    lines.push(
      "External link:",
      `  expected: ${result.expectedExternalLinkHtml}`,
      `  actual:   ${result.actualExternal}`,
    );
  }

  if (result.actualBroken !== result.expectedBrokenLinkHtml) {
    lines.push(
      "Broken link:",
      `  expected: ${result.expectedBrokenLinkHtml}`,
      `  actual:   ${result.actualBroken}`,
    );
  }

  if (result.error) {
    lines.push(`Error: ${result.error}`);
  }

  return lines.join("\n");
}

describe("rehype-smart-links", () => {
  const testResults: TestResult[] = [];

  it.each(testCases)("$title", async (testCase) => {
    const result = await runTest(testCase);
    testResults.push(result);

    expect(result.status, buildDiffMessage(result)).toBe("success");
  });

  afterAll(() => {
    if (testResults.length === 0)
      return;

    const reportPath = path.join(process.cwd(), "tests/results/report.html");
    generateHTMLReport(testResults, reportPath);

    const successes = testResults.filter((r) => r.status === "success").length;
    const failures = testResults.filter((r) => r.status === "failure").length;
    const errors = testResults.filter((r) => r.status === "error").length;

    console.warn(`\nTest summary: ${successes} passed, ${failures} failed, ${errors} errors, ${testResults.length} total`);
    console.warn(`HTML report: ${reportPath}`);
  });
});
