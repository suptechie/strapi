'use strict';

module.exports = () => ({
  extends: '@strapi/typescript-utils/tsconfigs/admin',

  include: ['../plugins/**/admin/src/**/*', './'],
  exclude: ['node_modules/', 'build/', 'dist/', '**/*.test.ts'],
});
