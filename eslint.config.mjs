import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import node from 'eslint-plugin-n';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  prettier,
  node.configs['flat/recommended-module'],
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    ignores: ['fixtures/**', 'dist/**', 'index.js'],
  },
];
