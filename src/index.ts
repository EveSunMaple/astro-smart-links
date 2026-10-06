import type { ScanRoutesOptions } from "./core/routes.js";

import { scanRoutes, writeRoutesFile } from "./core/routes.js";
import { smartLinks } from "./integration.js";

export { checkDirectory, collectHtmlFiles, routeFromHtmlFile } from "./core/check.js";
export type { BrokenAnchor, CheckDirectoryOptions, CheckDirectoryResult } from "./core/check.js";
export { classifyHref } from "./core/classify.js";
export type { ClassifiedLink } from "./core/classify.js";
export { addClass, hasClass, removeClass } from "./core/hast.js";
export {
  getScheme,
  isExternalHref,
  isIgnoredHref,
  normalizeBase,
  normalizeRoute,
  resolveInternalHref,
} from "./core/normalize.js";
export { loadRoutesFromFile, scanRoutes, writeRoutesFile } from "./core/routes.js";
export type { ScanRoutesOptions } from "./core/routes.js";
export { smartLinks } from "./integration.js";
export { default as rehypeSmartLinks, resolveRouteSet } from "./rehype.js";
export {
  buildReport,
  formatReport,
  reportToHTML,
  reportToJSON,
} from "./report.js";
export type { BrokenLinkEntry, SmartLinksReport } from "./report.js";
export {
  createLogger,
  defaultOptions,
  resolveOptions,
} from "./types.js";
export type {
  LinkMeta,
  LinkRecord,
  LinkType,
  LogLevel,
  ResolvedSmartLinksOptions,
  SmartLinksIntegrationOptions,
  SmartLinksLogger,
  SmartLinksOptions,
} from "./types.js";

/**
 * Generates a routes file by scanning a build directory.
 *
 * @deprecated The `smartLinks()` Astro integration no longer needs a routes
 * file, and the rehype plugin accepts a `routes` array directly.
 */
export function generateRoutesFile(
  buildDir: string = "./dist",
  routesFilePath: string = "./.smart-links-routes.json",
  options: ScanRoutesOptions = {},
): Set<string> {
  const routes = scanRoutes(buildDir, options);
  writeRoutesFile(routes, routesFilePath);
  return routes;
}

export default smartLinks;
