import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";

import { normalizeRoute } from "./normalize.js";

export interface ScanRoutesOptions {
  includeAllFiles?: boolean;
  includeFileExtensions?: string[];
  base?: string;
}

/**
 * Walks a build directory and returns the set of routes it contains.
 * `index.html` becomes `/`, `about.html` becomes `/about`.
 */
export function scanRoutes(directory: string, options: ScanRoutesOptions = {}): Set<string> {
  const routes = new Set<string>(["/"]);
  const {
    includeAllFiles = false,
    includeFileExtensions = ["html"],
    base,
  } = options;

  if (!existsSync(directory))
    return routes;

  const walk = (currentDir: string, basePath: string): void => {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath, basePath ? `${basePath}/${entry.name}` : entry.name);
        continue;
      }

      if (!entry.isFile())
        continue;

      const extension = extname(entry.name).slice(1).toLowerCase();
      const included = includeAllFiles || includeFileExtensions.includes(extension);
      if (!included)
        continue;

      let route = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (extension === "html") {
        route = route.replace(/\.html$/i, "");
        route = route.replace(/(?:^|\/)index$/i, "");
      }

      routes.add(normalizeRoute(route, base));
    }
  };

  walk(directory, "");

  return routes;
}

export function loadRoutesFromFile(routesFile: string, base?: string): Set<string> {
  const routes = new Set<string>(["/"]);

  if (!existsSync(routesFile))
    return routes;

  try {
    const parsed = JSON.parse(readFileSync(routesFile, "utf-8")) as unknown;
    if (Array.isArray(parsed)) {
      for (const route of parsed) {
        if (typeof route === "string")
          routes.add(normalizeRoute(route, base));
      }
    }
  }
  catch {
    // Ignore malformed route files; callers only lose broken-link detection.
  }

  return routes;
}

export function writeRoutesFile(routes: Iterable<string>, routesFilePath: string): void {
  const sorted = Array.from(new Set(routes)).sort();
  writeFileSync(routesFilePath, `${JSON.stringify(sorted, null, 2)}\n`);
}
