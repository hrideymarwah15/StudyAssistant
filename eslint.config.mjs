import nextPlugin from "@next/eslint-plugin-next";
import js from "@eslint/js";

export default [
  {
    ...js.configs.recommended,
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs['core-web-vitals'].rules,
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off",
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**"],
  },
];
