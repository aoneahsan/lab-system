import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'

export default tseslint.config(
  { ignores: ['dist/**', 'dev-dist/**', 'build/**', 'node_modules/**', '*.config.js', '*.config.ts', 'vite.config.*.ts', 'cypress.config.ts', 'android/**', 'ios/**', 'chrome-extension/dist/**', '.firebase/**', 'functions/lib/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'react': react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': 'warn',
      'no-prototype-builtins': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
)