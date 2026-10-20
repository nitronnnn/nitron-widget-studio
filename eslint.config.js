// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*'],
  },
  {
    files: ['plugins/**/*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        module: 'writable',
        require: 'readonly',
      },
    },
  },
]);
