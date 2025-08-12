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
      // Turn off all TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      // Turn off React rules
      'react/react-in-jsx-scope': 'off',
      'react-refresh/only-export-components': 'off',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'off',
      // Turn off general JS rules
      'no-prototype-builtins': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-empty': 'off',
      'no-constant-condition': 'off',
      'no-debugger': 'warn',
      'no-console': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
)