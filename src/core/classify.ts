import type { LinkType } from "../types.js";

import {
  isExternalHref,
  isIgnoredHref,
  matchesIgnoreList,
  normalizeRoute,
  resolveInternalHref,
} from "./normalize.js";

export interface ClassifyContext {
  base?: string;
  pagePath?: string;
  routes?: Set<string>;
  ignore?: (string | RegExp)[];
}

export interface ClassifiedLink {
  type: LinkType | "ignored";
  href: string;
  pathname?: string;
}

export function classifyHref(href: string, context: ClassifyContext = {}): ClassifiedLink {
  if (isIgnoredHref(href))
    return { type: "ignored", href };

  if (isExternalHref(href))
    return { type: "external", href };

  const pathname = normalizeRoute(resolveInternalHref(href, context.pagePath), context.base);

  if (matchesIgnoreList(href, pathname, context.ignore ?? []))
    return { type: "ignored", href, pathname };

  if (pathname === "/")
    return { type: "internal", href, pathname };

  if (context.routes && !context.routes.has(pathname))
    return { type: "broken", href, pathname };

  return { type: "internal", href, pathname };
}
