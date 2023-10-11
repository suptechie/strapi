import react from '@vitejs/plugin-react';
import path from 'path';
import { InlineConfig, createLogger } from 'vite';

import { resolveConfigProperty } from '../../core/config';

import type { ViteBaseTask } from './types';
import type { BuildContext } from '../../createBuildContext';

/**
 * @internal
 */
const resolveViteConfig = (ctx: BuildContext, task: ViteBaseTask) => {
  const { cwd, distPath, targets, external, extMap, pkg, exports: exportMap } = ctx;
  const { entries, format, output, runtime } = task;
  const outputExt = extMap[pkg.type || 'commonjs'][format];
  const outDir = path.relative(cwd, distPath);

  const customLogger = createLogger();
  customLogger.warn = (msg) => ctx.logger.warn(msg);
  customLogger.warnOnce = (msg) => ctx.logger.warn(msg);
  customLogger.error = (msg) => ctx.logger.error(msg);
  customLogger.info = () => {};

  const exportIds = Object.keys(exportMap).map((exportPath) => path.join(pkg.name, exportPath));
  const sourcePaths = Object.values(exportMap).map((exp) => path.resolve(cwd, exp.source));

  const config = {
    configFile: false,
    root: cwd,
    mode: 'production',
    logLevel: 'warn',
    clearScreen: false,
    customLogger,
    build: {
      minify: resolveConfigProperty(ctx.config.minify, false),
      sourcemap: resolveConfigProperty(ctx.config.sourcemap, true),
      /**
       * The task runner will clear this for us
       */
      emptyOutDir: false,
      target: targets[runtime],
      outDir,
      lib: {
        entry: entries.map((e) => e.entry),
        formats: [format],
        /**
         * this enforces the file name to match what the output we've
         * determined from the package.json exports. However, when preserving modules
         * we want to let Rollup handle the file names.
         */
        fileName: resolveConfigProperty(ctx.config.preserveModules, false)
          ? undefined
          : () => {
              return `${path.relative(outDir, output).replace(/\.[^/.]+$/, '')}${outputExt}`;
            },
      },
      rollupOptions: {
        external(id, importer) {
          // Check if the id is a self-referencing import
          if (exportIds?.includes(id)) {
            return true;
          }

          // Check if the id is a file path that points to an exported source file
          if (importer && (id.startsWith('.') || id.startsWith('/'))) {
            const idPath = path.resolve(path.dirname(importer), id);

            if (sourcePaths?.includes(idPath)) {
              ctx.logger.warn(
                `detected self-referencing import – treating as external: ${path.relative(
                  cwd,
                  idPath
                )}`
              );

              return true;
            }
          }

          const idParts = id.split('/');

          const name = idParts[0].startsWith('@') ? `${idParts[0]}/${idParts[1]}` : idParts[0];

          if (name && external.includes(name)) {
            return true;
          }

          return false;
        },
        output: {
          preserveModules: resolveConfigProperty(ctx.config.preserveModules, false),
          /**
           * Mimic TypeScript's behavior, by setting the value to "auto" to control
           * how Rollup handles default, namespace and dynamic imports from external
           * dependencies in formats like CommonJS that do not natively support
           * these concepts. Mainly styled-components@5
           *
           * For more info see https://rollupjs.org/configuration-options/#output-interop
           */
          interop: 'auto',
          chunkFileNames() {
            const parts = outputExt.split('.');

            if (parts.length === 3) {
              return `_chunks/[name]-[hash].${parts[2]}`;
            }

            return `_chunks/[name]-[hash]${outputExt}`;
          },
        },
      },
    },
    /**
     * We _could_ omit this, but we'd need to introduce the
     * concept of a custom config for the scripts straight away
     *
     * and since this is isolated to the Strapi CLI, we can make
     * some assumptions and add some weight until we move it outside.
     */
    plugins: runtime === 'node' ? [] : [react()],
  } satisfies InlineConfig;

  return config;
};

export { resolveViteConfig };
