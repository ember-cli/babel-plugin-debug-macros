import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import node from 'eslint-plugin-n';
import globals from 'globals';

export default [
  js.configs.recommended,
  prettier,
  node.configs['flat/recommended-module'],
  {
    languageOptions: {
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
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
  {
    ignores: ['fixtures/**'],
  },
];
