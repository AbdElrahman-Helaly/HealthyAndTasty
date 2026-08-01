import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Data fetching in effects (void load()) is the standard pattern here.
      // The new react-hooks v7 rule flags it unconditionally.
      'react-hooks/set-state-in-effect': 'off',
      // False positive with react-hook-form's watch() API (warning only).
      'react-hooks/incompatible-library': 'off',
    },
  },
])
