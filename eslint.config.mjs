import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import securityPlugin from "eslint-plugin-security";
import nextBabelParser from "next/dist/compiled/babel/eslint-parser.js";
import tsParser from "@typescript-eslint/parser";

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));

const reactRecommended = reactPlugin.configs.flat.recommended;
const reactHooksRecommended = reactHooksPlugin.configs.recommended;
const importRecommended = importPlugin.configs.recommended;
const importTypescript = importPlugin.configs.typescript;
const nextCoreWebVitals = nextPlugin.flatConfig.coreWebVitals;

const sharedSettings = {
  react: {
    version: "detect",
  },
  "import/parsers": {
    "@typescript-eslint/parser": [".ts", ".cts", ".mts", ".tsx", ".d.ts"],
  },
  "import/resolver": {
    node: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    typescript: {
      alwaysTryTypes: true,
      project: "./tsconfig.json",
    },
  },
};

export default [
  {
    ignores: [
      ".next/**",
      "coverage/**",
      "node_modules/**",
      "dist/**",
      "build/**",
    ],
  },
  js.configs.recommended,
  {
    name: "serpbear/base-rules",
    plugins: {
      "@next/next": nextPlugin,
      import: importPlugin,
      "jsx-a11y": jsxA11yPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      security: securityPlugin,
    },
    languageOptions: {
      parser: nextBabelParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        requireConfigFile: false,
        allowImportExportEverywhere: true,
        ecmaFeatures: {
          jsx: true,
        },
        babelOptions: {
          presets: ["next/babel"],
          caller: {
            supportsTopLevelAwait: true,
          },
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: sharedSettings,
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      ...reactRecommended.rules,
      ...reactHooksRecommended.rules,
      ...importRecommended.rules,
      ...importTypescript.rules,
      ...nextCoreWebVitals.rules,
      "jsx-a11y/alt-text": [
        "warn",
        {
          elements: ["img"],
          img: ["Image"],
        },
      ],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "react/jsx-no-target-blank": "off",
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/jsx-uses-react": "off",
      "linebreak-style": "off",
      indent: "off",
      "no-undef": "off",
      "no-console": "off",
      camelcase: "off",
      "object-curly-newline": "off",
      "no-use-before-define": "off",
      "no-await-in-loop": "off",
      "arrow-body-style": "off",
      "max-len": [
        "error",
        { code: 150, ignoreComments: true, ignoreUrls: true },
      ],
      "import/no-extraneous-dependencies": "off",
      "no-unused-vars": "off",
      "implicit-arrow-linebreak": "off",
      "function-paren-newline": "off",
      complexity: ["error", { max: 50 }],
      "comma-dangle": "off",
      "class-methods-use-this": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "TemplateLiteral[expressions.length > 0] > TemplateElement[value.raw*='<']",
          message:
            "Avoid HTML in template strings with interpolated variables for security reasons.",
        },
      ],
      "security/detect-non-literal-fs-filename": "error",
      "import/extensions": [
        "error",
        "ignorePackages",
        {
          "": "never",
          js: "never",
          jsx: "never",
          ts: "never",
          tsx: "never",
        },
      ],
    },
  },
  {
    name: "serpbear/typescript-parser",
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: baseDirectory,
        sourceType: "module",
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    name: "serpbear/tests-overrides",
    files: [
      "**/__tests__/**/*",
      "**/__mocks__/**/*",
      "**/*.test.*",
      "**/*.spec.*",
    ],
    rules: {
      "no-restricted-properties": "off",
      complexity: "off",
    },
  },
  {
    name: "serpbear/config-overrides",
    files: ["eslint.config.mjs"],
    rules: {
      "import/extensions": "off",
    },
  },
];
