import type { LinkRecord } from "./types.js";

export interface BrokenLinkEntry {
  href: string;
  pathname: string;
  sources: string[];
}

export interface SmartLinksReport {
  generatedAt: string;
  routes: number;
  links: {
    internal: number;
    external: number;
    broken: number;
  };
  broken: BrokenLinkEntry[];
}

export interface BuildReportInput {
  records: LinkRecord[];
  broken: { href: string; pathname: string; sourceFile?: string }[];
  routeCount: number;
}

export function buildReport(input: BuildReportInput): SmartLinksReport {
  const sourceMap = new Map<string, Set<string>>();
  for (const record of input.records) {
    if (!record.sourceFile)
      continue;

    const key = record.pathname ?? record.href;
    const sources = sourceMap.get(key) ?? new Set<string>();
    sources.add(record.sourceFile);
    sourceMap.set(key, sources);
  }

  const brokenMap = new Map<string, BrokenLinkEntry>();
  for (const link of input.broken) {
    const key = link.pathname || link.href;
    const entry = brokenMap.get(key) ?? { href: link.href, pathname: link.pathname, sources: [] };
    const sources = new Set(entry.sources);

    if (link.sourceFile)
      sources.add(link.sourceFile);

    for (const source of sourceMap.get(key) ?? [])
      sources.add(source);

    entry.sources = Array.from(sources);
    brokenMap.set(key, entry);
  }

  return {
    generatedAt: new Date().toISOString(),
    routes: input.routeCount,
    links: {
      internal: input.records.filter((record) => record.type === "internal").length,
      external: input.records.filter((record) => record.type === "external").length,
      broken: brokenMap.size,
    },
    broken: Array.from(brokenMap.values()).sort((a, b) => a.pathname.localeCompare(b.pathname)),
  };
}

export function formatReport(report: SmartLinksReport): string {
  const lines: string[] = [];
  lines.push(`Smart links report (${report.generatedAt})`);
  lines.push(`Routes scanned: ${report.routes}`);
  lines.push(`Links: ${report.links.internal} internal, ${report.links.external} external, ${report.links.broken} broken`);

  if (report.broken.length > 0) {
    lines.push("");
    lines.push("Broken internal links:");
    for (const entry of report.broken) {
      const sources = entry.sources.length > 0 ? ` (found in ${entry.sources.join(", ")})` : "";
      lines.push(`  ${entry.pathname || entry.href}${sources}`);
    }
  }

  return lines.join("\n");
}

export function reportToJSON(report: SmartLinksReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function reportToHTML(report: SmartLinksReport): string {
  const rows = report.broken
    .map((entry) => `
        <tr>
          <td><code>${escapeHtml(entry.pathname || entry.href)}</code></td>
          <td><code>${escapeHtml(entry.href)}</code></td>
          <td>${entry.sources.length > 0 ? entry.sources.map((source) => `<code>${escapeHtml(source)}</code>`).join("<br>") : "—"}</td>
        </tr>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>astro-smart-links report</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 960px; margin: 0 auto; padding: 2rem 1rem; line-height: 1.6; }
  h1 { font-size: 1.5rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid color-mix(in oklab, currentColor 20%, transparent); padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; }
  th { background: color-mix(in oklab, currentColor 8%, transparent); }
  code { font-size: 0.9em; }
  .ok { color: #16a34a; font-weight: 600; }
</style>
</head>
<body>
  <h1>astro-smart-links report</h1>
  <p>Generated at ${escapeHtml(report.generatedAt)} · Scanned ${report.routes} routes</p>
  <p>${report.links.internal} internal · ${report.links.external} external · ${report.links.broken} broken</p>
  ${report.broken.length === 0
    ? "<p class=\"ok\">No broken internal links found.</p>"
    : `<table>
    <thead><tr><th>Missing route</th><th>Href</th><th>Found in</th></tr></thead>
    <tbody>${rows}
    </tbody>
  </table>`}
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
