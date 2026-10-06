import type { Root } from "hast";
import type { VFile } from "vfile";

import { existsSync } from "node:fs";

import { normalizeRoute } from "./core/normalize.js";
import { loadRoutesFromFile, scanRoutes } from "./core/routes.js";
import { transformTree } from "./core/transform.js";
import { type ResolvedSmartLinksOptions, resolveOptions, type SmartLinksOptions } from "./types.js";

/**
 * Resolves the route set used for broken-link detection.
 * Returns `undefined` when no routes source was configured, in which case
 * every internal link is treated as valid.
 */
export function resolveRouteSet(options: ResolvedSmartLinksOptions): Set<string> | undefined {
  if (options.routes) {
    return new Set(options.routes.map((route) => normalizeRoute(route, options.base)));
  }

  if (options.routesFile) {
    if (!existsSync(options.routesFile)) {
      options.logger.warn(`Routes file not found: ${options.routesFile}`);
      return undefined;
    }
    return loadRoutesFromFile(options.routesFile, options.base);
  }

  if (options.publicDir) {
    if (!existsSync(options.publicDir)) {
      options.logger.warn(`Routes directory not found: ${options.publicDir}`);
      return undefined;
    }
    return scanRoutes(options.publicDir, {
      base: options.base,
      includeAllFiles: options.includeAllFiles,
      includeFileExtensions: options.includeFileExtensions,
    });
  }

  return undefined;
}

/**
 * Rehype plugin that styles internal, external and (optionally) broken links.
 *
 * When no route source (`routes`, `routesFile` or `publicDir`) is provided,
 * broken link detection is disabled and internal links are styled as valid.
 */
export default function rehypeSmartLinks(options: SmartLinksOptions = {}) {
  const resolved = resolveOptions(options);
  let routeSet: Set<string> | undefined;
  let routeSetResolved = false;

  return (tree: Root, file: VFile): void => {
    if (!routeSetResolved) {
      routeSet = resolveRouteSet(resolved);
      routeSetResolved = true;
      resolved.logger.debug(
        routeSet
          ? `Loaded ${routeSet.size} routes for broken-link detection`
          : "No routes configured, broken-link detection is disabled",
      );
    }

    transformTree(tree, file, { options: resolved, routes: routeSet });
  };
}
