import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // TS handles unused vars better; keep noise down in demo app
      'no-unused-vars': 'off',
      'no-undef': 'off',

      // Demo app: controllers use untyped Express Request/Response shapes.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
