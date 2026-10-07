[English](README.md) | [中文](README.zh-CN.md)

# astro-smart-links

一个 Astro 集成，让你的 Markdown 链接更智能：

- **内部链接**（页面存在）自动添加可自定义的类名。
- **断开的内部链接**（页面不存在）添加维基百科风格的红色样式，并在构建结束时输出报告。
- **外部链接**默认添加 `↗` 图标、`target="_blank"` 和 `rel="noopener noreferrer"`。

无需路由文件，无需二次构建：集成会在构建完成后使用真实的路由表校验链接。

> 从 `rehype-smart-links@0.x` 迁移？见 [迁移指南](#从-rehype-smart-links-迁移)。

## 环境要求

- Node.js 18.17 或更高版本。
- Astro 4 或更高版本。同时支持 Astro 7 默认的 Sätteri Markdown 处理器和 `@astrojs/markdown-remark` 的 unified 处理器。

## 安装

```bash
# npm
npm install astro-smart-links

# pnpm
pnpm add astro-smart-links

# yarn
yarn add astro-smart-links
```

## 使用

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

在全局 CSS 中添加样式：

```css
.internal-link {
  color: #2563eb;
}

/* 维基百科风格的红链 */
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

## 断链检测

构建完成后，集成会扫描生成的页面、得到真实路由表，然后：

1. 将断链从 `internal-link` 切换为 `broken-link`。
2. 在控制台输出报告。
3. 可选：写入 `.json`/`.html` 报告文件，和/或让构建失败。

```js
smartLinks({
  failOnBroken: true, // 发现断链时退出码非 0，适合 CI
  reportFile: ".smart-links-report.json", // 也可以是 .html
});
```

控制台输出示例：

```
[astro-smart-links] Smart links report (2026-01-01T00:00:00.000Z)
Routes scanned: 42
Links: 180 internal, 12 external, 2 broken

Broken internal links:
  /blog/old-post (found in src/content/blog/new-post.md)
```

链接匹配会自动忽略查询参数与哈希（`/about?x=1#team` 视为 `/about`），按当前页面解析相对链接，并处理 Astro `base` 子路径与结尾斜杠差异。

## CLI

可以检查任何构建目录，不限于 Astro 项目：

```bash
npx astro-smart-links check --dir dist --fail-on-broken
npx astro-smart-links check --json
npx astro-smart-links check --all --extensions html pdf zip
```

| 选项 | 描述 |
| --- | --- |
| `-d, --dir <path>` | 构建目录（默认 `./dist`） |
| `-o, --output <path>` | 将报告写入文件 |
| `--format <json\|html>` | 报告格式（默认 `json`） |
| `--json` | 以 JSON 输出到 stdout |
| `-a, --all` | 将所有文件类型视为有效路由 |
| `-e, --extensions <ext...>` | 要包含的文件扩展名（默认 `html`） |
| `--fail-on-broken` | 发现断链时以退出码 1 结束 |
| `-q, --quiet` | 只输出摘要 |

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `internalLinkClass` | `string` | `'internal-link'` | 内部链接的类名 |
| `externalLinkClass` | `string` | `'external-link'` | 外部链接的类名 |
| `brokenLinkClass` | `string` | `'broken-link'` | 断链的类名 |
| `content` | `{ type: 'text', value: string } \| null` | `{ type: 'text', value: '↗' }` | 外部链接追加的内容 |
| `contentClass` | `string` | `'external-icon'` | 外部链接图标的类名 |
| `target` | `string \| null` | `'_blank'` | 外部链接的 `target` |
| `rel` | `string \| null` | `'noopener noreferrer'` | 外部链接的 `rel` |
| `ignore` | `(string \| RegExp)[]` | `[]` | 不处理的链接（前缀匹配或正则） |
| `routes` | `string[]` | — | 显式路由列表 |
| `routesFile` | `string` | — | 包含路由列表的 JSON 文件 |
| `publicDir` | `string` | — | 扫描路由的目录 |
| `includeFileExtensions` | `string[]` | `['html']` | 扫描时视为路由的扩展名 |
| `includeAllFiles` | `boolean` | `false` | 将所有扫描到的文件视为路由 |
| `base` | `string` | Astro `base` | 站点子路径 |
| `wrapperTemplate` | `(node, type, meta) => Element` | — | 完全自定义链接的 HTML |
| `customInternalLinkTransform` | `(node, meta) => void` | — | 内部链接自定义转换 |
| `customExternalLinkTransform` | `(node, meta) => void` | — | 外部链接自定义转换 |
| `customBrokenLinkTransform` | `(node, meta) => void` | — | 断链自定义转换 |
| `onLink` | `(record) => void` | — | 每个已处理链接的回调 |
| `logger` / `logLevel` | `SmartLinksLogger \| false` / `'debug' \| 'info' \| 'warn' \| 'error' \| 'silent'` | `'warn'` | 日志 |
| `failOnBroken` | `boolean` | `false` | 集成选项：发现断链时让构建失败 |
| `reportFile` | `string` | — | 集成选项：写入报告文件 |
| `reportFormat` | `'json' \| 'html'` | `'json'` | 集成选项：报告格式 |

## 自定义

### 自定义 HTML 结构

`wrapperTemplate` 接收锚点 `node`、链接 `type` 和 `meta`（`{ href, pathname, className, sourceFile }`），返回替换后的节点：

```js
smartLinks({
  wrapperTemplate: (node, type, meta) => {
    if (type === "external") {
      node.properties.className = [...(node.properties.className ?? []), "tooltip"];
      node.properties["data-tip"] = `打开 ${meta.href}`;
    }
    return node;
  },
});
```

使用 `wrapperTemplate` 时由它负责添加类名；`meta.className` 中包含当前类型配置的类名。

### 自定义转换

```js
smartLinks({
  customExternalLinkTransform: (node, meta) => {
    node.properties.target = "_blank";
    node.properties.rel = "noopener noreferrer";
    node.properties["data-external"] = "true";
  },
});
```

自定义转换会完全接管该类型的链接，需要自行设置 `target`/`rel`。

### 忽略链接

```js
smartLinks({
  ignore: ["/draft/", /^\/preview\//],
});
```

## 直接使用 rehype 插件

集成基于一个导出的 rehype 插件实现，因此任何使用 rehype 的框架（Next.js、Gatsby 等）都可以使用。此时需要自行提供路由：

```js
import { rehypeSmartLinks } from "astro-smart-links";

rehypePlugins: [
  [rehypeSmartLinks, { routes: ["/", "/about"] }],
];
```

路由来源三选一：`routes`、`routesFile` 或 `publicDir`。都不提供时，所有内部链接都会被视为有效链接，只做样式标记。

## API

```js
import {
  smartLinks, // Astro 集成（默认导出）
  rehypeSmartLinks, // rehype 插件
  classifyHref,
  normalizeRoute,
  scanRoutes,
  checkDirectory,
  buildReport,
} from "astro-smart-links";
```

## 从 rehype-smart-links 迁移

`rehype-smart-links@0.x` 需要二次构建（`astro build && rehype-smart-links build && astro build`）和 `.smart-links-routes.json` 文件。升级到 `astro-smart-links@1.0`：

1. 安装 `astro-smart-links`，移除 `rehype-smart-links`。
2. 把 `markdown.rehypePlugins` 配置替换为 `smartLinks()` 集成。
3. 删除路由文件与 `build:with-routes` 脚本。
4. `wrapperTemplate` 签名变为 `(node, type, meta)`，并改为返回替换节点（不再合并到原节点）。

## 开发

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cd example && pnpm dev
```

## 许可证

[MIT](LICENSE)
