import type { Element } from "hast";
import { h } from "hastscript";

/**
 * Test case definition
 */
export interface TestCase {
  /** Unique identifier for the test case */
  id: string;

  /** Title of the test case */
  title: string;

  /** Description of what the test is checking */
  description: string;

  /** HTML for the internal link before transformation */
  internalLinkHtml: string;

  /** HTML for the external link before transformation */
  externalLinkHtml: string;

  /** HTML for the broken link before transformation */
  brokenLinkHtml: string;

  /** Expected HTML for the internal link after transformation */
  expectedInternalLinkHtml: string;

  /** Expected HTML for the external link after transformation */
  expectedExternalLinkHtml: string;

  /** Expected HTML for the broken link after transformation */
  expectedBrokenLinkHtml: string;

  /** Configuration for rehype-smart-links plugin */
  pluginConfig: Record<string, any>;
}

/**
 * Custom wrapper template for different link types (simplified version)
 */
function customWrapperTemplate(node: Element, type: string): Element {
  if (!node.properties) {
    node.properties = {};
  }

  if (!node.properties.className) {
    node.properties.className = [];
  }

  // Just add classes based on link type
  if (type === "external") {
    (node.properties.className as string[]).push("custom-external-class");
  }
  else if (type === "broken") {
    (node.properties.className as string[]).push("custom-broken-class");
  }
  else {
    (node.properties.className as string[]).push("custom-internal-class");
  }

  return node;
}

/**
 * Collection of test cases
 */
const testCases: TestCase[] = [
  // Default configuration test
  {
    id: "default-config",
    title: "Default Configuration",
    description: "Tests the default configuration with no custom options",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"internal-link\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"external-link\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<span class=\"external-icon\">↗</span></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"broken-link\">Broken Link</a>",
    pluginConfig: {},
  },

  // Custom classes test
  {
    id: "custom-classes",
    title: "Custom CSS Classes",
    description: "Tests custom class names for links",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"custom-internal\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"custom-external\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<span class=\"custom-icon\">↗</span></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"custom-broken\">Broken Link</a>",
    pluginConfig: {
      internalLinkClass: "custom-internal",
      externalLinkClass: "custom-external",
      brokenLinkClass: "custom-broken",
      contentClass: "custom-icon",
    },
  },

  // Custom external content test
  {
    id: "custom-content",
    title: "Custom External Link Content",
    description: "Tests custom content for external links",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"internal-link\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"external-link\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<span class=\"external-icon\">🔗</span></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"broken-link\">Broken Link</a>",
    pluginConfig: {
      content: { type: "text", value: "🔗" },
    },
  },

  // Custom target and rel attributes
  {
    id: "custom-attributes",
    title: "Custom Target and Rel Attributes",
    description: "Tests custom target and rel attributes for external links",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"internal-link\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"external-link\" target=\"_self\" rel=\"nofollow\">External Link<span class=\"external-icon\">↗</span></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"broken-link\">Broken Link</a>",
    pluginConfig: {
      target: "_self",
      rel: "nofollow",
    },
  },

  // Custom wrapper template
  {
    id: "custom-wrapper",
    title: "Custom Wrapper Template",
    description: "Tests simple custom wrapper template that adds classes based on link type",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"custom-internal-class\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"custom-external-class\" target=\"_blank\" rel=\"noopener noreferrer\">External Link</a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"custom-broken-class\">Broken Link</a>",
    pluginConfig: {
      wrapperTemplate: customWrapperTemplate,
    },
  },

  // Examples from custom-icon.mdx
  // Beautify Links with SVG Icons
  {
    id: "svg-icons",
    title: "Beautify Links with SVG Icons",
    description: "Tests adding SVG icons to links based on link type",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"flex items-center gap-1\">Internal Link<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"icon-internal\"><path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"></path><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"></path></svg></a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"flex items-center gap-1\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"icon-external\"><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"></path><polyline points=\"15 3 21 3 21 9\"></polyline><line x1=\"10\" y1=\"14\" x2=\"21\" y2=\"3\"></line></svg></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"flex items-center gap-1\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"icon-broken\"><path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"></path><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"></path><line x1=\"2\" y1=\"2\" x2=\"22\" y2=\"22\"></line></svg>Broken Link</a>",
    pluginConfig: {
      wrapperTemplate: (node, linkType) => {
        let icon;

        if (linkType === "internal") {
          // Internal link icon - chain icon
          icon = h("svg", {
            "xmlns": "http://www.w3.org/2000/svg",
            "width": "16",
            "height": "16",
            "viewBox": "0 0 24 24",
            "fill": "none",
            "stroke": "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "class": "icon-internal",
          }, [
            h("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }),
            h("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }),
          ]);

          // Add to the end of the link
          node.children.push(icon);
        }
        else if (linkType === "external") {
          // External link icon - external arrow
          icon = h("svg", {
            "xmlns": "http://www.w3.org/2000/svg",
            "width": "16",
            "height": "16",
            "viewBox": "0 0 24 24",
            "fill": "none",
            "stroke": "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "class": "icon-external",
          }, [
            h("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
            h("polyline", { points: "15 3 21 3 21 9" }),
            h("line", { x1: "10", y1: "14", x2: "21", y2: "3" }),
          ]);

          // Add to the end of the link
          node.children.push(icon);
        }
        else if (linkType === "broken") {
          // Broken link icon - broken chain
          icon = h("svg", {
            "xmlns": "http://www.w3.org/2000/svg",
            "width": "16",
            "height": "16",
            "viewBox": "0 0 24 24",
            "fill": "none",
            "stroke": "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "class": "icon-broken",
          }, [
            h("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }),
            h("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" }),
            h("line", { x1: "2", y1: "2", x2: "22", y2: "22" }),
          ]);

          // Add to the beginning of the link
          node.children = [icon, ...node.children];
        }

        // Add Flex layout styles
        if (icon) {
          node.properties.className = [
            ...(node.properties.className || []),
            "flex",
            "items-center",
            "gap-1",
          ];
        }

        return node;
      },
    },
  },

  // Icon Animation Effects
  {
    id: "icon-animation",
    title: "Icon Animation Effects",
    description: "Tests adding animated icons to links",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"flex items-center gap-1 group\">Internal Link<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"icon-animate group-hover:scale-125 transition-transform\"><path d=\"M5 12h14\"></path><path d=\"M12 5L19 12L12 19\"></path></svg></a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"flex items-center gap-1 group\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"icon-animate group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform\"><line x1=\"7\" y1=\"17\" x2=\"17\" y2=\"7\"></line><polyline points=\"7 7 17 7 17 17\"></polyline></svg></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"flex items-center gap-1 group\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" class=\"icon-animate group-hover:rotate-12 transition-transform text-red-500\"><circle cx=\"12\" cy=\"12\" r=\"10\"></circle><line x1=\"12\" y1=\"8\" x2=\"12\" y2=\"12\"></line><line x1=\"12\" y1=\"16\" x2=\"12.01\" y2=\"16\"></line></svg>Broken Link</a>",
    pluginConfig: {
      wrapperTemplate: (node, linkType) => {
        let icon;

        if (linkType === "internal") {
          // Internal link - arrow icon
          icon = h("svg", {
            "xmlns": "http://www.w3.org/2000/svg",
            "width": "16",
            "height": "16",
            "viewBox": "0 0 24 24",
            "fill": "none",
            "stroke": "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "class": "icon-animate group-hover:scale-125 transition-transform",
          }, [
            h("path", { d: "M5 12h14" }),
            h("path", { d: "M12 5L19 12L12 19" }),
          ]);
        }
        else if (linkType === "external") {
          // External link - diagonal arrow
          icon = h("svg", {
            "xmlns": "http://www.w3.org/2000/svg",
            "width": "16",
            "height": "16",
            "viewBox": "0 0 24 24",
            "fill": "none",
            "stroke": "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "class": "icon-animate group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform",
          }, [
            h("line", { x1: "7", y1: "17", x2: "17", y2: "7" }),
            h("polyline", { points: "7 7 17 7 17 17" }),
          ]);
        }
        else if (linkType === "broken") {
          // Broken link - warning icon
          icon = h("svg", {
            "xmlns": "http://www.w3.org/2000/svg",
            "width": "16",
            "height": "16",
            "viewBox": "0 0 24 24",
            "fill": "none",
            "stroke": "currentColor",
            "stroke-width": "2",
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "class": "icon-animate group-hover:rotate-12 transition-transform text-red-500",
          }, [
            h("circle", { cx: "12", cy: "12", r: "10" }),
            h("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
            h("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" }),
          ]);
        }

        // Add to node and set style classes
        if (icon) {
          if (linkType === "broken") {
            node.children = [icon, ...node.children];
          }
          else {
            node.children.push(icon);
          }

          node.properties.className = [
            ...(node.properties.className || []),
            "flex",
            "items-center",
            "gap-1",
            "group", // For hover state management
          ];
        }

        return node;
      },
    },
  },

  // Using Font Awesome Icons
  {
    id: "font-awesome",
    title: "Using Font Awesome Icons",
    description: "Tests using Font Awesome icons with links",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"flex items-center gap-2\">Internal Link<i class=\"fa fa-book\"></i></a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"flex items-center gap-2\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<i class=\"fa fa-external-link\"></i></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"flex items-center gap-2\"><i class=\"fa fa-exclamation-triangle\"></i>Broken Link</a>",
    pluginConfig: {
      wrapperTemplate: (node, linkType) => {
        let iconClass;

        if (linkType === "internal") {
          iconClass = "fa fa-book"; // Document icon
        }
        else if (linkType === "external") {
          iconClass = "fa fa-external-link"; // External link icon
        }
        else if (linkType === "broken") {
          iconClass = "fa fa-exclamation-triangle"; // Warning icon
        }

        if (iconClass) {
          const icon = h("i", { class: iconClass });

          // Decide icon position based on link type
          if (linkType === "broken") {
            node.children = [icon, ...node.children];
          }
          else {
            node.children.push(icon);
          }

          // Add flex layout
          node.properties.className = [
            ...(node.properties.className || []),
            "flex",
            "items-center",
            "gap-2",
          ];
        }

        return node;
      },
    },
  },

  // Examples from daisyui.mdx
  // DaisyUI Badge Links
  {
    id: "daisyui-badge",
    title: "DaisyUI Badge Links",
    description: "Tests styling links as DaisyUI badges",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"badge badge-primary\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"badge badge-secondary\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<span class=\"external-icon\">↗</span></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"badge badge-error\">Broken Link</a>",
    pluginConfig: {

      internalLinkClass: "badge badge-primary",
      externalLinkClass: "badge badge-secondary",
      brokenLinkClass: "badge badge-error",
    },
  },

  // DaisyUI Button Links
  {
    id: "daisyui-button",
    title: "DaisyUI Button Links",
    description: "Tests styling links as DaisyUI buttons",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"btn btn-primary btn-sm\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"btn btn-secondary btn-sm\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<span class=\"external-icon\">↗</span></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"btn btn-error btn-sm\">Broken Link</a>",
    pluginConfig: {
      internalLinkClass: "btn btn-primary btn-sm",
      externalLinkClass: "btn btn-secondary btn-sm",
      brokenLinkClass: "btn btn-error btn-sm",
    },
  },

  // DaisyUI Link Styles
  {
    id: "daisyui-link",
    title: "DaisyUI Link Styles",
    description: "Tests styling links with DaisyUI link classes",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"link link-primary\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"link link-secondary\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<span class=\"external-icon\">↗</span></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"link link-error\">Broken Link</a>",
    pluginConfig: {
      internalLinkClass: "link link-primary",
      externalLinkClass: "link link-secondary",
      brokenLinkClass: "link link-error",
    },
  },

  // DaisyUI Tooltips
  {
    id: "daisyui-tooltip",
    title: "DaisyUI Tooltip Links",
    description: "Tests wrapping links in DaisyUI tooltips",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<div class=\"tooltip tooltip-primary\" data-tip=\"Navigate to About page\"><a href=\"/internal-link\" class=\"link link-hover link-primary\">Internal Link</a></div>",
    expectedExternalLinkHtml: "<div class=\"tooltip tooltip-secondary\" data-tip=\"Opens in a new tab\"><a href=\"https://example.com\" class=\"link link-hover link-secondary\" target=\"_blank\" rel=\"noopener noreferrer\">External Link</a></div>",
    expectedBrokenLinkHtml: "<div class=\"tooltip tooltip-error\" data-tip=\"This link is broken\"><a href=\"/broken-link\" class=\"link link-hover link-error\">Broken Link</a></div>",
    pluginConfig: {
      wrapperTemplate: (node, linkType) => {
        // Apply appropriate link classes first
        node.properties.className = [
          "link",
          "link-hover",
          linkType === "internal"
            ? "link-primary"
            : linkType === "external"
              ? "link-secondary"
              : "link-error",
        ];

        // Create tooltip text based on link type
        let tooltipText;
        if (linkType === "internal") {
          tooltipText = "Navigate to About page";
        }
        else if (linkType === "external") {
          tooltipText = "Opens in a new tab";
        }
        else if (linkType === "broken") {
          tooltipText = "This link is broken";
        }

        // Create tooltip wrapper
        return h("div", {
          "class": `tooltip tooltip-${
            linkType === "internal"
              ? "primary"
              : linkType === "external"
                ? "secondary"
                : "error"
          }`,
          "data-tip": tooltipText,
        }, [node]);
      },
    },
  },

  // Examples from tailwind.mdx
  // Basic Tailwind Classes
  {
    id: "tailwind-basic",
    title: "Basic Tailwind Classes",
    description: "Tests applying basic Tailwind classes to links",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"text-blue-600 hover:text-blue-800 underline\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"text-purple-600 hover:text-purple-800 underline\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<span class=\"external-icon\">↗</span></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"text-red-600 hover:text-red-800 line-through\">Broken Link</a>",
    pluginConfig: {
      internalLinkClass: "text-blue-600 hover:text-blue-800 underline",
      externalLinkClass: "text-purple-600 hover:text-purple-800 underline",
      brokenLinkClass: "text-red-600 hover:text-red-800 line-through",

    },
  },

  // Advanced Tailwind Styling
  {
    id: "tailwind-advanced",
    title: "Advanced Tailwind Styling",
    description: "Tests applying advanced Tailwind utility classes to links",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"inline-flex items-center px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200\">Internal Link</a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"inline-flex items-center px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors duration-200\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<span class=\"external-icon\">↗</span></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"inline-flex items-center px-3 py-1 text-sm rounded-full bg-red-100 text-red-700 line-through opacity-75 cursor-not-allowed\">Broken Link</a>",
    pluginConfig: {
      internalLinkClass: "inline-flex items-center px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors duration-200",
      externalLinkClass: "inline-flex items-center px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors duration-200",
      brokenLinkClass: "inline-flex items-center px-3 py-1 text-sm rounded-full bg-red-100 text-red-700 line-through opacity-75 cursor-not-allowed",
    },
  },

  // Links with Tailwind Icons
  {
    id: "tailwind-icons",
    title: "Links with Tailwind Icons",
    description: "Tests adding SVG icons to links using Tailwind flex utilities",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<a href=\"/internal-link\" class=\"inline-flex items-center gap-1 text-blue-600 hover:text-blue-800\">Internal Link<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 7l5 5m0 0l-5 5m5-5H6\"></path></svg></a>",
    expectedExternalLinkHtml: "<a href=\"https://example.com\" class=\"inline-flex items-center gap-1 text-purple-600 hover:text-purple-800\" target=\"_blank\" rel=\"noopener noreferrer\">External Link<svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14\"></path></svg></a>",
    expectedBrokenLinkHtml: "<a href=\"/broken-link\" class=\"inline-flex items-center gap-1 text-red-600 hover:text-red-800\"><svg class=\"w-3.5 h-3.5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z\"></path></svg>Broken Link</a>",
    pluginConfig: { wrapperTemplate: (node, linkType) => {
      let icon;

      if (linkType === "internal") {
        // Internal link - right arrow
        icon = h("svg", {
          class: "w-3.5 h-3.5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          xmlns: "http://www.w3.org/2000/svg",
        }, [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            "d": "M13 7l5 5m0 0l-5 5m5-5H6",
          }),
        ]);

        // Add icon to the end of the link
        node.children.push(icon);
        node.properties.className = [
          "inline-flex",
          "items-center",
          "gap-1",
          "text-blue-600",
          "hover:text-blue-800",
        ];
      }
      else if (linkType === "external") {
        // External link - external link icon
        icon = h("svg", {
          class: "w-3.5 h-3.5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          xmlns: "http://www.w3.org/2000/svg",
        }, [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            "d": "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14",
          }),
        ]);

        // Add icon to the end of the link
        node.children.push(icon);
        node.properties.className = [
          "inline-flex",
          "items-center",
          "gap-1",
          "text-purple-600",
          "hover:text-purple-800",
        ];
      }
      else if (linkType === "broken") {
        // Broken link - warning icon
        icon = h("svg", {
          class: "w-3.5 h-3.5",
          fill: "none",
          stroke: "currentColor",
          viewBox: "0 0 24 24",
          xmlns: "http://www.w3.org/2000/svg",
        }, [
          h("path", {
            "stroke-linecap": "round",
            "stroke-linejoin": "round",
            "stroke-width": "2",
            "d": "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          }),
        ]);

        // Add icon to the beginning of the link
        node.children = [icon, ...node.children];
        node.properties.className = [
          "inline-flex",
          "items-center",
          "gap-1",
          "text-red-600",
          "hover:text-red-800",
        ];
      }

      return node;
    },
    },
  },

  // Tailwind Tooltip Links
  {
    id: "tailwind-tooltip",
    title: "Tailwind Tooltip Links",
    description: "Tests creating custom tooltips with Tailwind CSS",
    internalLinkHtml: "<a href=\"/internal-link\">Internal Link</a>",
    externalLinkHtml: "<a href=\"https://example.com\">External Link</a>",
    brokenLinkHtml: "<a href=\"/broken-link\">Broken Link</a>",
    expectedInternalLinkHtml: "<span class=\"group relative\"><a href=\"/internal-link\" class=\"text-blue-600 hover:text-blue-800 group-hover:underline\">Internal Link</a><span class=\"invisible group-hover:visible absolute left-1/2 -translate-x-1/2 -bottom-9 w-28 px-2 py-1 bg-gray-900 rounded-md text-center text-white text-xs after:content-[&quot;&quot;] after:absolute after:left-1/2 after:-top-1 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-gray-900\">Internal page</span></span>",
    expectedExternalLinkHtml: "<span class=\"group relative\"><a href=\"https://example.com\" class=\"text-purple-600 hover:text-purple-800 group-hover:underline\" target=\"_blank\" rel=\"noopener noreferrer\">External Link</a><span class=\"invisible group-hover:visible absolute left-1/2 -translate-x-1/2 -bottom-9 w-32 px-2 py-1 bg-gray-900 rounded-md text-center text-white text-xs after:content-[&quot;&quot;] after:absolute after:left-1/2 after:-top-1 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-gray-900\">Opens in new tab</span></span>",
    expectedBrokenLinkHtml: "<span class=\"group relative\"><a href=\"/broken-link\" class=\"text-red-600 hover:text-red-800 line-through cursor-not-allowed\">Broken Link</a><span class=\"invisible group-hover:visible absolute left-1/2 -translate-x-1/2 -bottom-9 w-28 px-2 py-1 bg-gray-900 rounded-md text-center text-white text-xs after:content-[&quot;&quot;] after:absolute after:left-1/2 after:-top-1 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-gray-900\">Link not found</span></span>",
    pluginConfig: {
      wrapperTemplate: (node, linkType) => {
        // Set link styles based on type
        if (linkType === "internal") {
          node.properties.className = ["text-blue-600", "hover:text-blue-800", "group-hover:underline"];

          // Create tooltip
          const tooltip = h("span", {
            class: "invisible group-hover:visible absolute left-1/2 -translate-x-1/2 -bottom-9 w-28 px-2 py-1 bg-gray-900 rounded-md text-center text-white text-xs after:content-[\"\"] after:absolute after:left-1/2 after:-top-1 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-gray-900",
          }, ["Internal page"]);

          // Wrap in container with tooltip
          return h("span", { class: "group relative" }, [node, tooltip]);
        }
        else if (linkType === "external") {
          node.properties.className = ["text-purple-600", "hover:text-purple-800", "group-hover:underline"];

          // Create tooltip
          const tooltip = h("span", {
            class: "invisible group-hover:visible absolute left-1/2 -translate-x-1/2 -bottom-9 w-32 px-2 py-1 bg-gray-900 rounded-md text-center text-white text-xs after:content-[\"\"] after:absolute after:left-1/2 after:-top-1 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-gray-900",
          }, ["Opens in new tab"]);

          // Wrap in container with tooltip
          return h("span", { class: "group relative" }, [node, tooltip]);
        }
        else if (linkType === "broken") {
          node.properties.className = ["text-red-600", "hover:text-red-800", "line-through", "cursor-not-allowed"];

          // Create tooltip
          const tooltip = h("span", {
            class: "invisible group-hover:visible absolute left-1/2 -translate-x-1/2 -bottom-9 w-28 px-2 py-1 bg-gray-900 rounded-md text-center text-white text-xs after:content-[\"\"] after:absolute after:left-1/2 after:-top-1 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-b-gray-900",
          }, ["Link not found"]);

          // Wrap in container with tooltip
          return h("span", { class: "group relative" }, [node, tooltip]);
        }

        return node;
      },
    },
  },
];

export default testCases;

/**
 * Helper function to add more test cases
 */
export function addTestCase(testCase: TestCase): void {
  testCases.push(testCase);
}
