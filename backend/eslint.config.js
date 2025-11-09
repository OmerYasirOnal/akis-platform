import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';
import { baseExtends, baseTsRules } from '../eslint.base.mjs';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    extends: baseExtends,
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...baseTsRules,
    },
  },
]);

