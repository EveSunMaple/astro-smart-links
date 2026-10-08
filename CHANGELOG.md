# Changelog

All notable changes to this project will be documented in this file.

## 1.1.1

### Added

- `skipClasses` option (integration, `checkDirectory()` and the `check` CLI via `--skip-classes`): links inside elements carrying one of these classes are skipped by the build-time check and are never rewritten. This keeps component or demo markup that opts out of content styles (e.g. Starlight's `not-content`) untouched.

### Fixed

- The example site's demo previews no longer receive an injected `broken-link` class from the build check, so each preview again shows exactly the styling produced by its documented snippet.

## 1.1.0

### Added

- Astro 7 support. The integration now inspects the configured `markdown.processor` and registers a Sätteri hast plugin (Astro 7 default) or a rehype plugin (unified from `@astrojs/markdown-remark`) instead of injecting the deprecated `markdown.rehypePlugins`, which no longer coerces cleanly on Astro 7.
- A Sätteri adapter that runs the shared link transform on a materialized copy of each anchor and writes the result back through the visitor context, so `wrapperTemplate` and custom transforms keep working on both processors.

### Changed

- Development dependency upgraded to Astro 7; CI runs on Node 22 and 24.
- The documentation example was rebuilt with Starlight (Astro 7 + Tailwind CSS 4 + daisyUI 5), including translated sidebars, search, i18n routes and edit links.

## 1.0.1

### Fixed

- Ship a CommonJS build (`dist/index.cjs`) and add the `require` export condition, so `require("astro-smart-links")` works in CJS configs (Next.js, Gatsby, ...) as documented. Previously the ESM-only exports map made CJS `require()` fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## 1.0.0

### Added

- `smartLinks()` Astro integration: styles internal, external and broken links during Markdown compilation, then validates every internal link against the real build route table in `astro:build:done` — no routes file and no second build.
- Broken link report with console summary and optional `.json`/`.html` output via `reportFile`.
- `failOnBroken` option to fail the build when broken links are found.
- `ignore` option that accepts strings (prefix match) and regular expressions.
- `astro-smart-links check` CLI for checking any build directory, with `--json`, `--output`, `--format`, `--fail-on-broken` and `--quiet` options.
- Proper link classification: `mailto:`, `tel:`, `data:`, `javascript:` and `#anchor` links are ignored; protocol-relative (`//example.com`) links are external; relative links are resolved against the current page; query strings and hashes are stripped before matching.
- `base` and trailing-slash aware route normalization.
- Public helper API: `classifyHref`, `normalizeRoute`, `scanRoutes`, `checkDirectory`, `buildReport`.
- Unit and integration test suites (Astro fixture build) and a GitHub Actions workflow.
- First-class Tailwind CSS 4 + daisyUI 5 example site.

### Changed

- Renamed the package from `rehype-smart-links` to `astro-smart-links`. The default export is now the Astro integration; the rehype plugin is available as the named export `rehypeSmartLinks`.
- `wrapperTemplate` now receives `(node, type, meta)` and its return value replaces the original node in the tree, which fixes the infinite recursion (maximum call stack) when wrapping a link element.
- Custom transforms receive `(node, meta)` with `href`/`pathname` information.
- Runtime dependencies (`unist-util-visit`, `rehype-parse`, `rehype-stringify`, `unified`, `vfile`, `@types/hast`) are declared correctly and no longer resolved from devDependencies.
- Tests now run against the local source instead of the published `0.2.0` package, and failures actually fail the test run.

### Removed

- The two-phase build workflow, the `.smart-links-routes.json` requirement and the `build:with-routes` scripts. The deprecated `build` CLI command and `generateRoutesFile()` remain for compatibility but are no longer needed.
- `0.x` options that never existed in code (`transformLink`, `externalLinkAttributes`, `openExternal`, `internalLinks`).
