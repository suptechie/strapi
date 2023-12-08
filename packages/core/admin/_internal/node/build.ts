import type { CLIContext } from '@strapi/strapi';
import EE from '@strapi/strapi/dist/utils/ee';
import * as tsUtils from '@strapi/typescript-utils';
import { checkRequiredDependencies } from './core/dependencies';
import { getTimer, prettyTime } from './core/timer';
import { createBuildContext } from './createBuildContext';
import { writeStaticClientFiles } from './staticFiles';
import { build as buildWebpack } from './webpack/build';

interface BuildOptions extends CLIContext {
  /**
   * @default false
   */
  ignorePrompts?: boolean;
  /**
   * Minify the output
   *
   * @default true
   */
  minify?: boolean;
  /**
   * Generate sourcemaps – useful for debugging bugs in the admin panel UI.
   */
  sourcemaps?: boolean;
  /**
   * Print stats for build
   */
  stats?: boolean;
}

/**
 * @example `$ strapi build`
 *
 * @description Builds the admin panel of the strapi application.
 */
const build = async ({ logger, cwd, tsconfig, ignorePrompts, ...options }: BuildOptions) => {
  const timer = getTimer();

  const { didInstall } = await checkRequiredDependencies({ cwd, logger, ignorePrompts }).catch(
    (err) => {
      logger.error(err.message);
      process.exit(1);
    }
  );

  if (didInstall) {
    return;
  }

  if (tsconfig?.config) {
    timer.start('compilingTS');
    const compilingTsSpinner = logger.spinner(`Compiling TS`).start();

    tsUtils.compile(cwd, { configOptions: { ignoreDiagnostics: false } });

    const compilingDuration = timer.end('compilingTS');
    compilingTsSpinner.text = `Compiling TS (${prettyTime(compilingDuration)})`;
    compilingTsSpinner.succeed();
  }

  timer.start('createBuildContext');
  const contextSpinner = logger.spinner(`Building build context`).start();
  console.log('');

  const ctx = await createBuildContext({
    cwd,
    logger,
    tsconfig,
    options,
  });
  const contextDuration = timer.end('createBuildContext');
  contextSpinner.text = `Building build context (${prettyTime(contextDuration)})`;
  contextSpinner.succeed();

  timer.start('buildAdmin');
  const buildingSpinner = logger.spinner(`Building admin panel`).start();
  console.log('');

  try {
    EE.init(cwd);

    await writeStaticClientFiles(ctx);
    await buildWebpack(ctx);

    const buildDuration = timer.end('buildAdmin');
    buildingSpinner.text = `Building admin panel (${prettyTime(buildDuration)})`;
    buildingSpinner.succeed();
  } catch (err) {
    buildingSpinner.fail();
    throw err;
  }
};

export { build };
export type { BuildOptions };
