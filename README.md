[English](README.md) | [中文](README.zh-CN.md)

# astro-smart-links

An Astro integration that gives every link in your Markdown a smarter style:

- **Internal links** (pages that exist) get a customizable class.
- **Broken internal links** (pages that do not exist) get a red, Wikipedia-style class and are reported at the end of the build.
- **External links** get an icon `↗`, `target="_blank"` and `rel="noopener noreferrer"` by default.

No routes file, no second build. The integration validates links against the real build output.

> Migrating from `rehype-smart-links@0.x`? See [Migration](#migration-from-rehype-smart-links).

## Requirements

- Node.js 18.17 or newer.
- Astro 4 or newer. Both Astro 7's default Sätteri Markdown processor and the unified processor from `@astrojs/markdown-remark` are supported.

## Installation

```bash
# npm
npm install astro-smart-links

# pnpm
pnpm add astro-smart-links

# yarn
yarn add astro-smart-links
```

## Usage

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import { smartLinks } from "astro-smart-links";

export default defineConfig({
  integrations: [
    smartLinks({
      internalLinkClass: "internal-link",
      externalLinkClass: "external-link",
      brokenLinkClass: "broken-link",
    }),
  ],
});
```

Add the classes to your global CSS:

```css
.internal-link {
  color: #2563eb;
}

/* Wikipedia-style broken link */
.broken-link {
  color: #dc2626;
  text-decoration: underline wavy;
}

.external-link {
  color: #7c3aed;
}

.external-link .external-icon {
  margin-left: 0.25em;
  font-size: 0.75em;
  opacity: 0.8;
}
```

## Broken link detection

When the build finishes, the integration scans the generated pages, builds the real route table and:

1. Switches broken internal links from `internal-link` to `broken-link`.
2. Prints a report to the console.
3. Optionally writes a `.json`/`.html` report and/or fails the build.

```js
smartLinks({
  failOnBroken: true, // exit non-zero on broken links (great for CI)
  reportFile: ".smart-links-report.json", // or .html
});
```

Console output:

```
[astro-smart-links] Smart links report (2026-01-01T00:00:00.000Z)
Routes scanned: 42
Links: 180 internal, 12 external, 2 broken

Broken internal links:
  /blog/old-post (found in src/content/blog/new-post.md)
```

Link matching ignores query strings and hashes (`/about?x=1#team` counts as `/about`), resolves relative links against the current page, and handles the Astro `base` sub-path and trailing-slash differences.

## CLI

Check any build directory, even outside Astro:

```bash
npx astro-smart-links check --dir dist --fail-on-broken
npx astro-smart-links check --json
npx astro-smart-links check --all --extensions html pdf zip
```

| Option | Description |
| --- | --- |
| `-d, --dir <path>` | Build directory (default `./dist`) |
| `-o, --output <path>` | Write the report to a file |
| `--format <json\|html>` | Report format (default `json`) |
| `--json` | Print the report to stdout |
| `-a, --all` | Treat every file type as a valid route |
| `-e, --extensions <ext...>` | File extensions to include (default `html`) |
| `--skip-classes <class...>` | Skip links inside elements with these classes |
| `--fail-on-broken` | Exit with code 1 when broken links are found |
| `-q, --quiet` | Only print the summary |

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `internalLinkClass` | `string` | `'internal-link'` | Class for internal links |
| `externalLinkClass` | `string` | `'external-link'` | Class for external links |
| `brokenLinkClass` | `string` | `'broken-link'` | Class for broken links |
| `content` | `{ type: 'text', value: string } \| null` | `{ type: 'text', value: '↗' }` | Content appended to external links |
| `contentClass` | `string` | `'external-icon'` | Class of the external icon |
| `target` | `string \| null` | `'_blank'` | `target` attribute for external links |
| `rel` | `string \| null` | `'noopener noreferrer'` | `rel` attribute for external links |
| `ignore` | `(string \| RegExp)[]` | `[]` | Hrefs that are never processed (prefix match or RegExp) |
| `skipClasses` | `string[]` | `[]` | Skip links inside elements with these classes (e.g. `['not-content']`) |
| `routes` | `string[]` | — | Explicit route list for broken-link detection |
| `routesFile` | `string` | — | JSON file with a route list |
| `publicDir` | `string` | — | Directory to scan for routes |
| `includeFileExtensions` | `string[]` | `['html']` | Extensions treated as routes while scanning |
| `includeAllFiles` | `boolean` | `false` | Treat every scanned file as a route |
| `base` | `string` | Astro `base` | Site sub-path |
| `wrapperTemplate` | `(node, type, meta) => Element` | — | Fully customize the link HTML |
| `customInternalLinkTransform` | `(node, meta) => void` | — | Custom transform for internal links |
| `customExternalLinkTransform` | `(node, meta) => void` | — | Custom transform for external links |
| `customBrokenLinkTransform` | `(node, meta) => void` | — | Custom transform for broken links |
| `onLink` | `(record) => void` | — | Called for every processed link |
| `logger` / `logLevel` | `SmartLinksLogger \| false` / `'debug' \| 'info' \| 'warn' \| 'error' \| 'silent'` | `'warn'` | Diagnostics |
| `failOnBroken` | `boolean` | `false` | Integration option: fail the build on broken links |
| `reportFile` | `string` | — | Integration option: write a report file |
| `reportFormat` | `'json' \| 'html'` | `'json'` | Integration option: report format |

## Customization

### Custom HTML structure

`wrapperTemplate` receives the anchor `node`, the link `type` and a `meta` object (`{ href, pathname, className, sourceFile }`), and returns the replacement node:

```js
smartLinks({
  wrapperTemplate: (node, type, meta) => {
    if (type === "external") {
      node.properties.className = [...(node.properties.className ?? []), "tooltip"];
      node.properties["data-tip"] = `Opens ${meta.href}`;
    }
    return node;
  },
});
```

When `wrapperTemplate` is provided it is responsible for applying classes; `meta.className` contains the configured class for the link type.

### Custom transforms

```js
smartLinks({
  customExternalLinkTransform: (node, meta) => {
    node.properties.target = "_blank";
    node.properties.rel = "noopener noreferrer";
    node.properties["data-external"] = "true";
  },
});
```

Custom transforms fully take over the given link type, so set `target`/`rel` yourself when needed.

### Ignoring links

```js
smartLinks({
  ignore: ["/draft/", /^\/preview\//],
});
```

## Using the rehype plugin directly

The integration is built on an exported rehype plugin, so any rehype-based framework (Next.js, Gatsby, ...) can use it. In that case you provide the routes yourself:

```js
import { rehypeSmartLinks } from "astro-smart-links";

// unified / Astro markdown config
rehypePlugins: [
  [rehypeSmartLinks, { routes: ["/", "/about"] }],
];
```

Routes come from `routes`, `routesFile` or `publicDir`. When none is given, every internal link is treated as valid and only styled.

## API

```js
import {
  smartLinks, // Astro integration (default export)
  rehypeSmartLinks, // rehype plugin
  classifyHref,
  normalizeRoute,
  scanRoutes,
  checkDirectory,
  buildReport,
} from "astro-smart-links";
```

## Migration from rehype-smart-links

`rehype-smart-links@0.x` required a two-phase build (`astro build && rehype-smart-links build && astro build`) and a `.smart-links-routes.json` file. In `astro-smart-links@1.0`:

1. Install `astro-smart-links` and remove `rehype-smart-links`.
2. Replace the `markdown.rehypePlugins` entry with the `smartLinks()` integration.
3. Delete the routes file and the `build:with-routes` script.
4. `wrapperTemplate` now receives `(node, type, meta)` instead of `(node, type, className)`, and returns a replacement node instead of being merged into the original one.

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cd example && pnpm dev
```

## License

[MIT](LICENSE)
