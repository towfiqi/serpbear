import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';
import pluginSecurity from 'eslint-plugin-security';

const baseDirectory = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory,
});

export default [
  {
    ignores: ['.next/**'],
  },
  ...compat.extends('next/core-web-vitals', 'airbnb-base'),
  {
    name: 'serpbear/custom-rules',
    plugins: {
      security: pluginSecurity,
    },
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'linebreak-style': 0,
      indent: 'off',
      'no-undef': 'off',
      'no-console': 'off',
      camelcase: 'off',
      'object-curly-newline': 'off',
      'no-use-before-define': 'off',
      'no-await-in-loop': 'off',
      'arrow-body-style': 'off',
      'max-len': ['error', { code: 150, ignoreComments: true, ignoreUrls: true }],
      'import/no-extraneous-dependencies': 'off',
      'no-unused-vars': 'off',
      'implicit-arrow-linebreak': 'off',
      'function-paren-newline': 'off',
      complexity: ['error', { max: 50 }],
      'comma-dangle': ['error', 'always-multiline'],
      'class-methods-use-this': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: "TemplateLiteral[expressions.length > 0] > TemplateElement[value.raw*='<']",
          message:
            'Avoid HTML in template strings with interpolated variables for security reasons.',
        },
      ],
      'security/detect-non-literal-fs-filename': 'error',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          '': 'never',
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
    },
  },
  {
    name: 'serpbear/tests-overrides',
    files: ['**/__tests__/**/*', '**/__mocks__/**/*', '**/*.test.*', '**/*.spec.*'],
    rules: {
      'no-restricted-properties': 'off',
      complexity: 'off',
    },
  },
];
