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

const determinism = [
  {
    selector: 'Literal[raw=/^\\d*\\.\\d|[eE]-/]',
    message: 'The sim uses integer maths only.',
  },
  {
    selector: 'CallExpression[callee.property.name=/^(sort|toSorted)$/][arguments.length=0]',
    message: 'Sort with a total comparator.',
  },
];

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', 'design/**', 'docs/**'] },
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
    files: ['packages/sim/src/**/*.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        'Date',
        'performance',
        'window',
        'document',
        'setTimeout',
        'setInterval',
        'crypto',
      ],
      'no-restricted-properties': [
        'error',
        ...['random', 'sin', 'cos', 'tan', 'sqrt', 'pow', 'atan2', 'exp', 'log', 'hypot'].map(
          (property) => ({
            object: 'Math',
            property,
            message: 'Not deterministic across engines.',
          }),
        ),
      ],
      'no-restricted-syntax': ['error', ...htmlSinks, ...determinism],
    },
  },
  {
    files: ['apps/game/src/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['apps/game/api/**/*.ts', 'apps/game/server/**/*.ts', 'tools/**/*.ts', '**/*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.config.ts', '**/*.config.js', 'eslint.config.js'],
    rules: { 'no-restricted-exports': 'off' },
  },
  {
    files: ['**/*.js', '**/*.cjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
