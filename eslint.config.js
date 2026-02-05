/**
 * Global-Fi Ultra - ESLint Configuration
 */

export default {
    env: {
        node: true,
        es2022: true,
        jest: true,
    },
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    extends: ['eslint:recommended'],
    rules: {
        'no-console': 'warn',
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'prefer-const': 'error',
        'no-var': 'error',
        'eqeqeq': 'error',
        semi: ['error', 'always'],
        quotes: ['error', 'single', { avoidEscape: true }],
    },
};
