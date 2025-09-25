// Basic flat config for the whole monorepo
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  /** @type {import('eslint').Linter.Config} */ ({
    files: ["**/*.{js,ts,tsx,mjs,cjs}"],
    ignores: [
      "poll/.next/**",
      "poll/node_modules/**",
      "node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      // ignore legacy static JS to avoid noise
      "assets/**",
      "bingo/**",
      "board/**",
      "compass/**",
      "game/**",
      "hotels/**",
      "house/**",
      "legacytierlist/**",
      "party/**",
      "population/**",
      "sites/**",
      "startpage/**",
      "stats/**",
      "syid/**",
      "syofficial/**",
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "eqeqeq": "error",
      "curly": ["error", "multi-line"],
    }
  })
];

