#!/usr/bin/env node

import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

import { Command } from "commander";

import { checkDirectory } from "./core/check.js";
import { scanRoutes, writeRoutesFile } from "./core/routes.js";
import { buildReport, formatReport, reportToHTML, reportToJSON } from "./report.js";

interface CheckCliOptions {
  dir: string;
  output?: string;
  format: "json" | "html";
  json: boolean;
  all: boolean;
  extensions: string[];
  failOnBroken: boolean;
  quiet: boolean;
}

interface LegacyBuildOptions {
  dir: string;
  output: string;
  all: boolean;
  extensions: string[];
}

const program = new Command();

program
  .name("astro-smart-links")
  .description("CLI utility for astro-smart-links")
  .version("1.1.0");

program
  .command("check", { isDefault: true })
  .description("Check a build directory for broken internal links")
  .option("-d, --dir <path>", "Build directory path", "./dist")
  .option("-o, --output <path>", "Write the report to a file")
  .option("--format <format>", "Report format: json or html", "json")
  .option("--json", "Print the report to stdout as JSON", false)
  .option("-a, --all", "Treat every file type as a valid route", false)
  .option("-e, --extensions <ext...>", "File extensions to treat as routes", ["html"])
  .option("--fail-on-broken", "Exit with code 1 when broken links are found", false)
  .option("-q, --quiet", "Only print the summary line", false)
  .action((options: CheckCliOptions) => {
    const buildDir = resolve(process.cwd(), options.dir);
    const routesFile = options.output ? resolve(process.cwd(), options.output) : undefined;

    if (!existsSync(buildDir)) {
      console.error(`Error: build directory '${buildDir}' does not exist.`);
      process.exit(2);
    }

    const { routes, broken, checkedLinks } = checkDirectory(buildDir, {
      includeAllFiles: options.all,
      includeFileExtensions: options.extensions,
      rewrite: false,
      routes: scanRoutes(buildDir, {
        includeAllFiles: options.all,
        includeFileExtensions: options.extensions,
      }),
    });

    const report = buildReport({ records: [], broken, routeCount: routes.size });
    report.links.broken = broken.length;

    if (options.json)
      process.stdout.write(reportToJSON(report));
    else if (!options.quiet)
      console.warn(formatReport(report));

    console.warn(
      `Checked ${checkedLinks} links across ${routes.size} routes: ${broken.length} broken.`,
    );

    if (routesFile) {
      writeFileSync(routesFile, options.format === "html" ? reportToHTML(report) : reportToJSON(report));
      console.warn(`Report written to ${routesFile}`);
    }

    if (options.failOnBroken && broken.length > 0)
      process.exit(1);

    process.exit(0);
  });

program
  .command("build")
  .description("[deprecated] Generate a routes file from a build directory")
  .option("-d, --dir <path>", "Build directory path", "./dist")
  .option("-o, --output <path>", "Output path for the routes file", "./.smart-links-routes.json")
  .option("-a, --all", "Include all files", false)
  .option("-e, --extensions <ext...>", "File extensions to include", ["html"])
  .action((options: LegacyBuildOptions) => {
    console.warn(
      "[astro-smart-links] The `build` command is deprecated: the smartLinks() integration no longer needs a routes file.",
    );

    const buildDir = resolve(process.cwd(), options.dir);
    if (!existsSync(buildDir)) {
      console.error(`Error: build directory '${buildDir}' does not exist.`);
      process.exit(2);
    }

    const routes = scanRoutes(buildDir, {
      includeAllFiles: options.all,
      includeFileExtensions: options.extensions,
    });
    const routesFile = resolve(process.cwd(), options.output);
    writeRoutesFile(routes, routesFile);
    console.warn(`Wrote ${routes.size} routes to ${routesFile}`);
  });

program.parse(process.argv);
