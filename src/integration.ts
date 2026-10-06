import type { AstroIntegration } from "astro";

import type { LinkRecord, ResolvedSmartLinksOptions, SmartLinksIntegrationOptions, SmartLinksLogger, SmartLinksOptions } from "./types.js";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { checkDirectory } from "./core/check.js";
import rehypeSmartLinks from "./rehype.js";
import { buildReport, formatReport, reportToHTML, reportToJSON } from "./report.js";
import { resolveOptions } from "./types.js";

/**
 * Astro integration that styles internal, external and broken links.
 *
 * External and internal links are styled while Markdown is compiled. Once the
 * build finished, the generated HTML is validated against the real route table
 * so that broken internal links can be highlighted and reported without a
 * second build.
 */
export function smartLinks(options: SmartLinksIntegrationOptions = {}): AstroIntegration {
  const records: LinkRecord[] = [];
  let resolved: ResolvedSmartLinksOptions | undefined;
  let projectRoot = process.cwd();

  return {
    name: "astro-smart-links",
    hooks: {
      "astro:config:setup": ({ config, updateConfig, logger }) => {
        records.length = 0;
        projectRoot = fileURLToPath(config.root);

        const adapter: SmartLinksLogger = {
          debug: (message) => logger.debug(message),
          info: (message) => logger.info(message),
          warn: (message) => logger.warn(message),
          error: (message) => logger.error(message),
        };

        const {
          failOnBroken: _failOnBroken,
          reportFile: _reportFile,
          reportFormat: _reportFormat,
          ...linkOptions
        } = options;

        resolved = resolveOptions({
          ...linkOptions,
          base: config.base,
          pagesDir: fileURLToPath(new URL("pages/", config.srcDir)),
          logger: adapter,
          onLink: (record) => {
            records.push(record);
            linkOptions.onLink?.(record);
          },
        });

        updateConfig({
          markdown: {
            rehypePlugins: [
              [rehypeSmartLinks as never, resolved as SmartLinksOptions],
            ],
          },
        });
      },

      "astro:build:done": async ({ dir, logger }) => {
        const current = resolved;
        if (!current)
          return;

        const distDir = fileURLToPath(dir);

        const { routes, broken } = checkDirectory(distDir, {
          base: current.base,
          ignore: current.ignore,
          includeAllFiles: current.includeAllFiles,
          includeFileExtensions: current.includeFileExtensions,
          rewrite: true,
          internalLinkClass: current.internalLinkClass,
          brokenLinkClass: current.brokenLinkClass,
        });

        const sourcesByPath = new Map<string, Set<string>>();
        for (const record of records) {
          if (!record.sourceFile || !record.pathname)
            continue;
          const sources = sourcesByPath.get(record.pathname) ?? new Set<string>();
          sources.add(record.sourceFile);
          sourcesByPath.set(record.pathname, sources);
        }

        const report = buildReport({
          records,
          routeCount: routes.size,
          broken: broken.map((entry) => ({
            href: entry.href,
            pathname: entry.pathname,
            sourceFile: sourcesByPath.get(entry.pathname)?.values().next().value
              ?? entry.sourceFile,
          })),
        });

        if (broken.length > 0) {
          logger.warn(formatReport(report));
        }
        else {
          logger.info(`Checked ${records.length} links, no broken internal links found`);
        }

        if (options.reportFile) {
          const reportPath = resolve(projectRoot, options.reportFile);
          const format = options.reportFormat ?? "json";
          writeFileSync(reportPath, format === "html" ? reportToHTML(report) : reportToJSON(report));
          logger.info(`Report written to ${reportPath}`);
        }

        if (options.failOnBroken && broken.length > 0)
          throw new Error(`astro-smart-links found ${broken.length} broken internal link(s). See the report above.`);
      },
    },
  };
}

export default smartLinks;
