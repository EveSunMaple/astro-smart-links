import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { smartLinks } from "astro-smart-links";

// https://astro.build/config
export default defineConfig({
  site: "https://astro-smart-links.vercel.app",
  integrations: [
    mdx(),
    sitemap(),
    smartLinks({
      reportFile: ".smart-links-report.json",
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      transformers: [{
        preprocess(code, options) {
          this.meta = { lang: options.lang || "plaintext" };
          return code;
        },
        pre(node) {
          const language = this.meta?.lang.toUpperCase() || "plaintext";

          return {
            type: "element",
            tagName: "div",
            properties: {
              class: "not-prose astro-code",
            },
            children: [
              {
                type: "element",
                tagName: "div",
                properties: {
                  class: "astro-code-toolbar",
                },
                children: [
                  {
                    type: "element",
                    tagName: "span",
                    properties: { class: "astro-code-toolbar-language" },
                    children: [{ type: "text", value: language }],
                  },
                  {
                    type: "element",
                    tagName: "button",
                    properties: {
                      "class": "btn-copy",
                      "aria-label": "Copy code",
                      "type": "button",
                    },
                    children: [
                      {
                        type: "element",
                        tagName: "span",
                        properties: {
                          "class": "astro-code-toolbar-copy-icon",
                          "aria-hidden": "true",
                        },
                        children: [
                          {
                            type: "element",
                            tagName: "svg",
                            properties: {
                              "xmlns": "http://www.w3.org/2000/svg",
                              "width": "18",
                              "height": "18",
                              "viewBox": "0 0 24 24",
                              "fill": "none",
                              "stroke": "currentColor",
                              "stroke-width": "2",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "class": "copy-icon",
                            },
                            children: [
                              {
                                type: "element",
                                tagName: "rect",
                                properties: {
                                  x: "9",
                                  y: "9",
                                  width: "13",
                                  height: "13",
                                  rx: "2",
                                  ry: "2",
                                },
                                children: [],
                              },
                              {
                                type: "element",
                                tagName: "path",
                                properties: {
                                  d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
                                },
                                children: [],
                              },
                            ],
                          },
                        ],
                      },
                      {
                        type: "element",
                        tagName: "span",
                        properties: {
                          "class": "astro-code-toolbar-copy-success hidden",
                          "aria-hidden": "true",
                        },
                        children: [
                          {
                            type: "element",
                            tagName: "svg",
                            properties: {
                              "xmlns": "http://www.w3.org/2000/svg",
                              "width": "18",
                              "height": "18",
                              "viewBox": "0 0 24 24",
                              "fill": "none",
                              "stroke": "currentColor",
                              "stroke-width": "2",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                              "class": "success-icon",
                            },
                            children: [
                              {
                                type: "element",
                                tagName: "path",
                                properties: {
                                  d: "M20 6L9 17l-5-5",
                                },
                                children: [],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                ...node,
                properties: {
                  ...node.properties,
                  class: "astro-code-content",
                },
                children: [
                  {
                    type: "element",
                    tagName: "code",
                    properties: {
                      class: "grid [&>.line]:px-4",
                      style: "counter-reset: line",
                    },
                    children: node.children,
                  },
                ],
              },
            ],
          };
        },
        line(node) {
          return {
            ...node,
            properties: {
              ...node.properties,
              class: "line before:content-[counter(line)]",
              style: "counter-increment: line",
            },
          };
        },
        code(node) {
          delete node.properties.style;
          return node;
        },
      },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
