import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/generated/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: { parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }, globals: { fetch: 'readonly', URL: 'readonly', URLSearchParams: 'readonly', process: 'readonly', Buffer: 'readonly', console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' } },
    plugins: { '@typescript-eslint': plugin },
    rules: { ...plugin.configs.recommended.rules, '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': ['error', { patterns: [{ group: ['**/modules/*/**', '!**/modules/*/index.js'], message: 'Import another module through its index.ts public API.' }] }] }
  }
];
