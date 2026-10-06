const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

export function getScheme(href: string): string | undefined {
  const match = SCHEME_RE.exec(href.trim());
  return match ? match[0].slice(0, -1).toLowerCase() : undefined;
}

export function isExternalHref(href: string): boolean {
  const trimmed = href.trim();
  if (trimmed.startsWith("//"))
    return true;

  const scheme = getScheme(trimmed);
  return scheme === "http" || scheme === "https";
}

export function isIgnoredHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#"))
    return true;

  const scheme = getScheme(trimmed);
  return Boolean(scheme) && scheme !== "http" && scheme !== "https";
}

/** Returns the base path without a trailing slash, e.g. `/docs` or `''`. */
export function normalizeBase(base?: string): string {
  if (!base)
    return "";

  let normalized = base.trim();
  if (!normalized.startsWith("/"))
    normalized = `/${normalized}`;

  normalized = normalized.replace(/\/+$/, "");
  return normalized === "/" ? "" : normalized;
}

/**
 * Normalizes a route or pathname so that every representation of the same page
 * compares equal: strips query/hash, the configured base, trailing slashes and
 * `/index.html` suffixes.
 */
export function normalizeRoute(input: string, base?: string): string {
  let path = (input ?? "").trim();
  path = path.split(/[?#]/, 1)[0] ?? "";

  try {
    path = decodeURI(path);
  }
  catch {
    // Keep the raw value when it cannot be decoded.
  }

  const normalizedBase = normalizeBase(base);
  if (normalizedBase) {
    if (path === normalizedBase)
      path = "/";
    else if (path.startsWith(`${normalizedBase}/`))
      path = path.slice(normalizedBase.length);
  }

  if (!path.startsWith("/"))
    path = `/${path}`;

  path = path.replace(/\/{2,}/g, "/");
  path = path.replace(/\/index(?:\.html)?$/i, "/");

  if (path.length > 1)
    path = path.replace(/\/+$/, "");

  return path || "/";
}

/**
 * Resolves a possibly relative href against the page it was found on and
 * returns the normalized pathname.
 */
export function resolveInternalHref(href: string, pagePath?: string): string {
  const trimmed = href.trim();

  if (trimmed.startsWith("/"))
    return normalizeRoute(trimmed);

  const page = pagePath && pagePath !== "/" ? pagePath : "/index";
  try {
    const url = new URL(trimmed, `https://smart-links.local${page}`);
    return normalizeRoute(url.pathname);
  }
  catch {
    return normalizeRoute(trimmed);
  }
}

export function matchesIgnoreList(href: string, pathname: string | undefined, ignore: (string | RegExp)[]): boolean {
  for (const pattern of ignore) {
    if (typeof pattern === "string") {
      if (href === pattern || href.startsWith(pattern) || pathname === pattern || pathname?.startsWith(pattern))
        return true;
    }
    else if (pattern.test(href) || (pathname ? pattern.test(pathname) : false)) {
      return true;
    }
  }
  return false;
}
