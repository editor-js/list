import CodeX from 'eslint-config-codex';
import { plugin as TsPlugin, parser as TsParser } from 'typescript-eslint';

export default [
  ...CodeX,

  /**
   * Redefine language options and some of the rules of CodeX eslint config for javascript config
   */
  {
    files: ['vite.config.js', 'eslint.config.mjs', 'postcss.config.js', '**/json-preview.js'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      'n/no-extraneous-import': ['error', {
        allowModules: ['typescript-eslint'],
      }],
    },
  },

  /**
   * Redefine language oprions and some of the rules of the CodeX eslint config for typescript config
   */
  {
    name: 'editorjs-nested-list',
    ignores: ['vite.config.js', 'eslint.config.mjs', 'postcss.config.js', '**/json-preview.js'],
    plugins: {
      '@typescript-eslint': TsPlugin,
    },

    /**
     * This are the options for typescript files
     */
    languageOptions: {
      parser: TsParser,
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: './',
        sourceType: 'module', // Allows for the use of imports
      },
    },

    rules: {
      'n/no-missing-import': ['off'],
      'n/no-unpublished-import': ['error', {
        allowModules: ['eslint-config-codex'],
        ignoreTypeImport: true,
      }],
      'n/no-unsupported-features/node-builtins': ['error', {
        version: '>=22.1.0',
      }],
      '@typescript-eslint/no-empty-object-type': ['error', {
        allowInterfaces: 'always',
      }],
    },
  },
];
