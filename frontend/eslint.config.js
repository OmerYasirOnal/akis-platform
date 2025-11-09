import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import { baseExtends, baseTsRules } from '../eslint.base.mjs'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [...baseExtends, reactHooks.configs['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      ...baseTsRules,
    },
  },
])
