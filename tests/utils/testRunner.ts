import type { TestCase } from "../cases/testCases";
import fs from "node:fs";

import path from "node:path";

import * as cheerio from "cheerio";
import rehypeParse from "rehype-parse";
import { rehypeSmartLinks } from "rehype-smart-links";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";

export interface TestResult {
  id: string;
  title: string;
  status: "success" | "failure" | "error";
  description?: string;
  // Test input
  internalLinkHtml: string;
  externalLinkHtml: string;
  brokenLinkHtml: string;
  // Expected output
  expectedInternalLinkHtml: string;
  expectedExternalLinkHtml: string;
  expectedBrokenLinkHtml: string;
  // Actual output
  actualInternal?: string;
  actualExternal?: string;
  actualBroken?: string;
  // Config
  pluginConfig: Record<string, any>;
  error?: string;
}

/**
 * 运行测试用例
 * @param testCase 测试用例对象
 */
export async function runTest(testCase: TestCase): Promise<TestResult> {
  // 基本测试结果
  const result: TestResult = {
    id: testCase.id,
    title: testCase.title,
    status: "error",
    description: testCase.description,
    // Test input
    internalLinkHtml: testCase.internalLinkHtml,
    externalLinkHtml: testCase.externalLinkHtml,
    brokenLinkHtml: testCase.brokenLinkHtml,
    // Expected output
    expectedInternalLinkHtml: testCase.expectedInternalLinkHtml,
    expectedExternalLinkHtml: testCase.expectedExternalLinkHtml,
    expectedBrokenLinkHtml: testCase.expectedBrokenLinkHtml,
    // Config
    pluginConfig: testCase.pluginConfig,
  };

  try {
    // 创建测试HTML
    const testHtml = `
      <html>
        <body>
          <div id="internal-container">${testCase.internalLinkHtml}</div>
          <div id="external-container">${testCase.externalLinkHtml}</div>
          <div id="broken-container">${testCase.brokenLinkHtml}</div>
        </body>
      </html>
    `;

    try {
      const pluginConfig = {
        routes: ["/internal-link"],
        logger: false as const,
        ...testCase.pluginConfig,
      };

      const file = await unified()
        .use(rehypeParse)
        .use(rehypeSmartLinks, pluginConfig)
        .use(rehypeStringify)
        .process(testHtml);

      const processedHtml = String(file);
      const processedLinks = extractLinks(processedHtml);

      result.actualInternal = processedLinks.internal;
      result.actualExternal = processedLinks.external;
      result.actualBroken = processedLinks.broken;

      // 检查结果是否匹配预期
      if (
        compareHTML(result.actualInternal, result.expectedInternalLinkHtml)
        && compareHTML(result.actualExternal, result.expectedExternalLinkHtml)
        && compareHTML(result.actualBroken, result.expectedBrokenLinkHtml)
      ) {
        result.status = "success";
      }
      else {
        result.status = "failure";
      }
    }
    catch (processingError) {
      result.status = "error";
      result.error = processingError instanceof Error
        ? processingError.message
        : String(processingError);
    }
  }
  catch (error) {
    result.status = "error";
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

/**
 * 从HTML字符串中提取链接
 * @param html HTML字符串
 * @returns 提取的链接 {internal, external, broken}
 */
function extractLinks(html: string): { internal: string; external: string; broken: string } {
  const $ = cheerio.load(html);

  return {
    internal: $("#internal-container").html() || "",
    external: $("#external-container").html() || "",
    broken: $("#broken-container").html() || "",
  };
}

/**
 * Compares two HTML strings semantically (attribute order and whitespace are
 * ignored) by parsing both and serializing them with sorted attributes.
 */
function compareHTML(actual: string, expected: string): boolean {
  return normalizeHTML(actual) === normalizeHTML(expected);
}

interface HtmlNode {
  type: string;
  data?: string;
  name?: string;
  attribs?: Record<string, string>;
  children?: HtmlNode[];
}

function normalizeHTML(html: string): string {
  const $ = cheerio.load(`<div id="__smart_links_root__">${html}</div>`, null, false);

  const serialize = (node: HtmlNode): string => {
    if (node.type === "text")
      return node.data ?? "";
    if (node.type === "comment")
      return `<!--${node.data ?? ""}-->`;

    const tag = node.name ?? "";
    const attributes = Object.entries(node.attribs ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");
    const children = (node.children ?? []).map(serialize).join("");

    return `<${tag}${attributes ? ` ${attributes}` : ""}>${children}</${tag}>`;
  };

  return $("#__smart_links_root__")
    .contents()
    .map((_, element) => serialize(element as unknown as HtmlNode))
    .get()
    .join("")
    .replace(/\s+/g, "");
}

/**
 * 生成HTML报告
 * @param results 测试结果数组
 * @param outputPath 输出路径
 */
export function generateHTMLReport(results: TestResult[], outputPath: string): void {
  const statusEmoji = {
    success: "✔️",
    failure: "⚠️",
    error: "❎",
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>rehype-smart-links Test Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .test-card {
      border: 1px solid #ddd;
      border-radius: 5px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #ddd;
    }
    .test-title {
      font-weight: bold;
      font-size: 1.2em;
      margin: 0;
    }
    .status-success { color: #2e7d32; }
    .status-failure { color: #ff9800; }
    .status-error { color: #d32f2f; }
    .test-body {
      padding: 15px;
    }
    .comparison {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }
    .comparison-header {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .code-block {
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 3px;
      padding: 10px;
      overflow-x: auto;
      font-family: monospace;
      white-space: pre-wrap;
    }
    .error-message {
      background-color: #ffebee;
      border: 1px solid #ffcdd2;
      color: #d32f2f;
      padding: 10px;
      border-radius: 3px;
      margin-top: 15px;
    }
    .link-preview {
      margin-top: 10px;
      padding: 15px;
      border: 1px dashed #ddd;
      border-radius: 5px;
    }
    .link-preview-header {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .summary {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }
    .config-container {
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <h1>rehype-smart-links Test Report</h1>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>
      Total Tests: ${results.length} | 
      Passed: ${results.filter((r) => r.status === "success").length} ✔️ | 
      Failed: ${results.filter((r) => r.status === "failure").length} ⚠️ | 
      Errors: ${results.filter((r) => r.status === "error").length} ❎
    </p>
  </div>

  <h2>Test Results</h2>
  
  ${results.map((result) => `
    <div class="test-card">
      <div class="test-header">
        <div class="test-title">${result.title}</div>
        <div class="status-${result.status}">
          ${statusEmoji[result.status]} ${result.status.toUpperCase()}
        </div>
      </div>
      <div class="test-body">
        ${result.description ? `<p>${escapeHTML(result.description)}</p>` : ""}
        
        <h3>Plugin Configuration</h3>
        <pre class="code-block">${escapeHTML(JSON.stringify(result.pluginConfig, null, 2))}</pre>
        
        ${result.error
          ? `
          <div class="error-message">
            <strong>Error:</strong> ${escapeHTML(result.error)}
          </div>
        `
          : `
          <h3>Internal Link Comparison</h3>
          <div class="comparison">
            <div>
              <div class="comparison-header">Expected:</div>
              <pre class="code-block">${escapeHTML(result.expectedInternalLinkHtml)}</pre>
              <div class="link-preview">
                <div class="link-preview-header">Rendered Preview:</div>
                ${result.expectedInternalLinkHtml}
              </div>
            </div>
            <div>
              <div class="comparison-header">Actual:</div>
              <pre class="code-block">${escapeHTML(result.actualInternal || "")}</pre>
              <div class="link-preview">
                <div class="link-preview-header">Rendered Preview:</div>
                ${result.actualInternal || ""}
              </div>
            </div>
          </div>
          
          <h3>External Link Comparison</h3>
          <div class="comparison">
            <div>
              <div class="comparison-header">Expected:</div>
              <pre class="code-block">${escapeHTML(result.expectedExternalLinkHtml)}</pre>
              <div class="link-preview">
                <div class="link-preview-header">Rendered Preview:</div>
                ${result.expectedExternalLinkHtml}
              </div>
            </div>
            <div>
              <div class="comparison-header">Actual:</div>
              <pre class="code-block">${escapeHTML(result.actualExternal || "")}</pre>
              <div class="link-preview">
                <div class="link-preview-header">Rendered Preview:</div>
                ${result.actualExternal || ""}
              </div>
            </div>
          </div>
          
          <h3>Broken Link Comparison</h3>
          <div class="comparison">
            <div>
              <div class="comparison-header">Expected:</div>
              <pre class="code-block">${escapeHTML(result.expectedBrokenLinkHtml)}</pre>
              <div class="link-preview">
                <div class="link-preview-header">Rendered Preview:</div>
                ${result.expectedBrokenLinkHtml}
              </div>
            </div>
            <div>
              <div class="comparison-header">Actual:</div>
              <pre class="code-block">${escapeHTML(result.actualBroken || "")}</pre>
              <div class="link-preview">
                <div class="link-preview-header">Rendered Preview:</div>
                ${result.actualBroken || ""}
              </div>
            </div>
          </div>
        `}
      </div>
    </div>
  `).join("")}
</body>
</html>
`;

  // 确保目录存在
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html);
}

/**
 * 转义HTML字符串
 * @param str 输入字符串
 * @returns 转义后的字符串
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
