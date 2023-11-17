import { defineConfig, Config } from '@strapi/pack-up';
import { transformWithEsbuild } from 'vite';
const config: Config = defineConfig({
  bundles: [
    {
      source: './admin/src/index.ts',
      import: './dist/admin/index.mjs',
      require: './dist/admin/index.js',
      types: './dist/admin/src/index.d.ts',
      runtime: 'web',
    },
    {
      source: './server/src/index.ts',
      import: './dist/server/index.mjs',
      require: './dist/server/index.js',
      types: './dist/server/src/index.d.ts',
      runtime: 'node',
    },
  ],
  externals: ['path'],

  dist: './dist',
  /**
   * Because we're exporting a server & client package
   * which have different runtimes we want to ignore
   * what they look like in the package.json
   */
  exports: {},
});

export default config;
