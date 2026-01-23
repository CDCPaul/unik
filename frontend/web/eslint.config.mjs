import next from '@next/eslint-plugin-next';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'dist/**'],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@next/next': next,
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...(next.configs.recommended?.rules ?? {}),
      ...(next.configs['core-web-vitals']?.rules ?? {}),
      // Keep the classic, widely-used hooks rules only (avoid newer "set-state-in-effect"/"static-components").
      'react-hooks/rules-of-hooks': 'error',
      // We intentionally keep deps warnings off in this codebase (many effects are "load once" by design).
      'react-hooks/exhaustive-deps': 'off',
      // Allow <img> usage (we rely on remote images / dynamic CMS content frequently).
      '@next/next/no-img-element': 'off',
    },
  },
];







