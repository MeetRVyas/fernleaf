import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';
import { fileURLToPath, URL } from 'node:url';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/generated/**', 'coverage/**', '.corepack/**', '**/.next/**'] },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } }, globals: { fetch: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', RequestInfo: 'readonly', Response: 'readonly', process: 'readonly', Buffer: 'readonly', console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' } },
    plugins: { '@typescript-eslint': plugin, boundaries },
    settings: { 'boundaries/elements': [{ type: 'module', pattern: '**/modules/*' }], 'import/resolver': [{ [fileURLToPath(new URL('./tools/eslint-typescript-resolver.cjs', import.meta.url))]: {} }, 'node'] },
    rules: { ...plugin.configs.recommended.rules, '@typescript-eslint/no-explicit-any': 'error',
      'boundaries/dependencies': ['error', { default: 'allow', policies: [{ to: { element: { type: 'module' } }, disallow: { to: { element: { fileInternalPath: '!index.ts' } } } }] }] }
  }
];
