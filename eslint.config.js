import antfu from "@antfu/eslint-config";

export default antfu({
  formatters: true,
  ignores: [
    "tests/results/**",
    "tests/fixtures/**/dist/**",
    "dist/**",
    "example/**",
    "**/*.md",
  ],
  stylistic: {
    quotes: "double", // As the Chinese teacher said, single quotes should be inside double quotes.(
    semi: true,
  },
  rules: {
    // Ignore the antfu/top-level-function rule
    "antfu/top-level-function": "off",
    "arrow-parens": ["warn", "always"],
    "style/arrow-parens": ["warn", "always"],
  },
});
