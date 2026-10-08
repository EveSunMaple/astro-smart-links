import type { Element } from "hast";

export type LinkType = "internal" | "external" | "broken";

export type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

export interface SmartLinksLogger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

export interface LinkMeta {
  /** Original href attribute value. */
  href: string;
  /** Normalized pathname for internal links (without query, hash or base). */
  pathname?: string;
  /** Class name that is applied to the link. */
  className?: string;
  /** Absolute path of the source file, when known. */
  sourceFile?: string;
}

export interface LinkRecord {
  type: LinkType;
  href: string;
  pathname?: string;
  sourceFile?: string;
}

export interface SmartLinksOptions {
  /** Content appended to external links. Set to `null` to disable. */
  content?: { type: "text"; value: string } | null;
  internalLinkClass?: string;
  externalLinkClass?: string;
  brokenLinkClass?: string;
  contentClass?: string;
  target?: string;
  rel?: string;
  /**
   * Hrefs that should never be processed. Matched against the raw href and the
   * normalized pathname (for strings: prefix match).
   */
  ignore?: (string | RegExp)[];
  /**
   * Links inside elements carrying one of these classes are skipped by the
   * build-time check and are never rewritten. Useful for component or demo
   * markup that opts out of content styles (e.g. Starlight's `not-content`).
   */
  skipClasses?: string[];
  /** Explicit list of known routes. When provided, broken links are detected. */
  routes?: string[];
  /** Path to a JSON file containing a list of known routes. */
  routesFile?: string;
  /** Directory that is scanned for routes when no routes are provided. */
  publicDir?: string;
  /** File extensions that are treated as routes when scanning. */
  includeFileExtensions?: string[];
  /** Include every file found while scanning, regardless of extension. */
  includeAllFiles?: boolean;
  /** Site base path, e.g. `/docs`. */
  base?: string;
  /** Absolute path of the `src/pages` directory (used to resolve relative links). */
  pagesDir?: string;
  /** Logger used for diagnostics. Set to `false` to silence output. */
  logger?: SmartLinksLogger | false;
  logLevel?: LogLevel;
  wrapperTemplate?: (node: Element, type: LinkType, meta: LinkMeta) => Element | undefined;
  customInternalLinkTransform?: (node: Element, meta: LinkMeta) => void;
  customExternalLinkTransform?: (node: Element, meta: LinkMeta) => void;
  customBrokenLinkTransform?: (node: Element, meta: LinkMeta) => void;
  /** Called for every processed link. */
  onLink?: (record: LinkRecord) => void;
}

export interface ResolvedSmartLinksOptions
  extends Omit<
    SmartLinksOptions,
    | "content"
    | "ignore"
    | "routes"
    | "logger"
    | "logLevel"
    | "includeFileExtensions"
    | "internalLinkClass"
    | "externalLinkClass"
    | "brokenLinkClass"
    | "contentClass"
    | "target"
    | "rel"
  > {
  content: { type: "text"; value: string } | null;
  internalLinkClass: string;
  externalLinkClass: string;
  brokenLinkClass: string;
  contentClass: string;
  target: string | null;
  rel: string | null;
  ignore: (string | RegExp)[];
  routes?: string[];
  includeFileExtensions: string[];
  includeAllFiles: boolean;
  base: string;
  logger: SmartLinksLogger;
  logLevel: LogLevel;
}

export interface SmartLinksIntegrationOptions extends SmartLinksOptions {
  /** Fail the build when broken internal links are found. */
  failOnBroken?: boolean;
  /** Write a report file when broken links are found. */
  reportFile?: string;
  /** Format of the report file. */
  reportFormat?: "json" | "html";
}

export const defaultOptions = {
  content: { type: "text" as const, value: "↗" },
  internalLinkClass: "internal-link",
  externalLinkClass: "external-link",
  brokenLinkClass: "broken-link",
  contentClass: "external-icon",
  target: "_blank",
  rel: "noopener noreferrer",
  ignore: [] as (string | RegExp)[],
  includeFileExtensions: ["html"],
  includeAllFiles: false,
  base: "",
  logLevel: "warn" as LogLevel,
};

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export function createLogger(logLevel: LogLevel): SmartLinksLogger {
  const threshold = LOG_LEVEL_WEIGHT[logLevel] ?? LOG_LEVEL_WEIGHT.warn;

  const write = (level: Exclude<LogLevel, "silent">, message: string): void => {
    if (LOG_LEVEL_WEIGHT[level] < threshold)
      return;

    const prefix = `[astro-smart-links]`;
    if (level === "error")
      console.error(`${prefix} ${message}`);
    else if (level === "warn")
      console.warn(`${prefix} ${message}`);
    else
      console.warn(`${prefix} ${message}`);
  };

  return {
    debug: (message: string) => write("debug", message),
    info: (message: string) => write("info", message),
    warn: (message: string) => write("warn", message),
    error: (message: string) => write("error", message),
  };
}

export function resolveOptions(options: SmartLinksOptions = {}): ResolvedSmartLinksOptions {
  const logLevel = options.logLevel
    ?? (options.logger === false ? "silent" : defaultOptions.logLevel);

  const logger = options.logger === false
    ? createLogger("silent")
    : options.logger ?? createLogger(logLevel);

  return {
    ...options,
    content: options.content === undefined ? { ...defaultOptions.content } : options.content,
    internalLinkClass: options.internalLinkClass ?? defaultOptions.internalLinkClass,
    externalLinkClass: options.externalLinkClass ?? defaultOptions.externalLinkClass,
    brokenLinkClass: options.brokenLinkClass ?? defaultOptions.brokenLinkClass,
    contentClass: options.contentClass ?? defaultOptions.contentClass,
    target: options.target === undefined ? defaultOptions.target : options.target,
    rel: options.rel === undefined ? defaultOptions.rel : options.rel,
    ignore: options.ignore ?? [],
    includeFileExtensions: options.includeFileExtensions ?? defaultOptions.includeFileExtensions,
    includeAllFiles: options.includeAllFiles ?? defaultOptions.includeAllFiles,
    base: options.base ?? defaultOptions.base,
    logger,
    logLevel,
  };
}
