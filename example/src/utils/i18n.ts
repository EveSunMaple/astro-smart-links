export type Lang = "zh" | "en";

/**
 * Returns the equivalent path of `path` in the target language.
 * Chinese pages live at the root, English pages under `/en`.
 */
export function getEquivalentPath(path: string, targetLang: Lang): string {
  const normalized = path === "/" ? "/" : path.replace(/\/+$/, "");

  if (targetLang === "zh") {
    if (normalized === "/" || normalized === "")
      return "/";

    const withoutPrefix = normalized.replace(/^\/en(?=\/|$)/, "");
    return withoutPrefix || "/";
  }

  if (normalized === "/" || normalized === "")
    return "/en";

  return normalized.startsWith("/en")
    ? normalized
    : `/en${normalized}`;
}
