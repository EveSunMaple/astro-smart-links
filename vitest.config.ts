import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "rehype-smart-links": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      "astro-smart-links": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: true,
  },
});
