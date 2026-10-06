# Changelog

All notable changes to this project will be documented in this file.

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
