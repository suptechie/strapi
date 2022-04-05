'use strict';

module.exports = () => ({
  extends: '@strapi/typescript-utils/lib/configs/server',

  include: [
    // Include the root directory
    './',
    // Force the JSON files in the src folder to be included
    'src/**/*.json',
  ],

  exclude: [
    'node_modules/',
    'build/',
    'dist/',
    '.cache/',
    '.tmp/',

    // Do not include admin files in the server compilation
    'src/admin/',
    // Do not include test files
    '**/*.test.ts',
    // Do not include plugins in the server compilation
    'src/plugins/**',
  ],
});
