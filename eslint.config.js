import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const htmlSinks = [
  {
    selector: 'MemberExpression[property.name=/^(innerHTML|outerHTML)$/]',
    message: 'Build DOM with createElement and textContent.',
  },
  {
    selector: 'CallExpression[callee.property.name=/^(insertAdjacentHTML|write|writeln)$/]',
    message: 'Build DOM with createElement and textContent.',
  },
];

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', 'design/**'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      complexity: ['error', 8],
      'max-depth': ['error', 2],
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'no-else-return': ['error', { allowElseIf: false }],
      'no-lonely-if': 'error',
      'no-nested-ternary': 'error',
      'no-warning-comments': 'error',
      'no-restricted-syntax': ['error', ...htmlSinks],
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
    },
  },
  {
    files: ['apps/game/src/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['apps/game/src/core/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        ...['Date', 'performance', 'window', 'document', 'navigator', 'fetch'].map((name) => ({
          name,
          message: 'core is pure and deterministic.',
        })),
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG.' },
      ],
      'no-restricted-syntax': [
        'error',
        ...htmlSinks,
        { selector: 'Literal[raw=/\\d\\.\\d/]', message: 'core uses integers only.' },
      ],
    },
  },
  {
    files: ['apps/game/api/**/*.ts', 'tools/**/*.ts', '**/*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.config.ts', '**/*.config.js', 'eslint.config.js', 'knip.ts'],
    rules: { 'no-restricted-exports': 'off' },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
