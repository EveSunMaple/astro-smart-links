import starlight from "@astrojs/starlight";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { smartLinks } from "astro-smart-links";

// https://astro.build/config
export default defineConfig({
  site: "https://astro-smart-links.vercel.app",
  integrations: [
    starlight({
      title: "astro-smart-links",
      description:
        "An Astro integration that adds smart styling and broken-link detection to internal and external links.",
      logo: {
        src: "./src/assets/logo.svg",
        alt: "astro-smart-links",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/EveSunMaple/astro-smart-links",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/EveSunMaple/astro-smart-links/edit/main/example/",
      },
      lastUpdated: true,
      locales: {
        root: { label: "中文", lang: "zh-CN" },
        en: { label: "English", lang: "en" },
      },
      sidebar: [
        {
          label: "快速上手",
          translations: { en: "Quick Start" },
          items: [
            {
              label: "安装指南",
              translations: { en: "Installation" },
              slug: "quick-start",
            },
            {
              label: "断链检查",
              translations: { en: "Broken Links" },
              slug: "quick-start/route-script",
            },
          ],
        },
        {
          label: "演示",
          translations: { en: "Demos" },
          items: [
            { label: "基本演示", translations: { en: "Basic Demo" }, slug: "demo/basic" },
            { label: "高级功能", translations: { en: "Advanced Features" }, slug: "demo/advanced" },
            { label: "自定义图标", translations: { en: "Custom Icons" }, slug: "demo/custom-icon" },
            { label: "CSS 自定义样式", translations: { en: "Custom CSS" }, slug: "demo/custom-css" },
            { label: "Tailwind 样式", translations: { en: "Tailwind Styles" }, slug: "demo/tailwind" },
            { label: "DaisyUI 组件", translations: { en: "DaisyUI Components" }, slug: "demo/daisyui" },
          ],
        },
        {
          label: "关于",
          translations: { en: "About" },
          slug: "about",
        },
      ],
      customCss: ["./src/styles/global.css"],
    }),
    smartLinks({
      reportFile: ".smart-links-report.json",
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
