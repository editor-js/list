import CodeX from 'eslint-config-codex';
import { plugin as TsPlugin, parser as TsParser } from 'typescript-eslint';

export default [
  ...CodeX,
  {
    name: 'editorjs-nested-list',
    ignores: ['vite.config.js'],
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
      'n/no-extraneous-import': ['error', {
        allowModules: ['typescript-eslint'],
      }],
      '@typescript-eslint/no-empty-object-type': ['error', {
        allowInterfaces: 'always',
      }],
    },
  },
];
