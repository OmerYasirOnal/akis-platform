import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export const baseExtends = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
];

export const baseTsRules = {
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    },
  ],
};
