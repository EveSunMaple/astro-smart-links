import process from "node:process";
import { defineConfig } from "astro/config";
import { smartLinks } from "../../../src/index.ts";

export default defineConfig({
  integrations: [
    smartLinks({
      failOnBroken: process.env.SMART_LINKS_FAIL_ON_BROKEN === "1",
      reportFile: "smart-links-report.json",
    }),
  ],
});
