import { createCommand } from 'commander';
import tsUtils from '@strapi/typescript-utils';
import { strapiFactory } from '@strapi/core';

import type { StrapiCommand } from '../../types';
import { runAction } from '../../utils/helpers';

interface CmdOptions {
  debug?: boolean;
  silent?: boolean;
  verbose?: boolean;
  outDir?: string;
}

const action = async ({ debug, silent, verbose, outDir }: CmdOptions) => {
  if ((debug || verbose) && silent) {
    console.error('Flags conflict: both silent and debug mode are enabled, exiting...');
    process.exit(1);
  }

  const appContext = await strapiFactory.compile({ ignoreDiagnostics: true });
  const app = await strapiFactory(appContext).register();

  await tsUtils.generators.generate({
    strapi: app,
    pwd: appContext.appDir,
    rootDir: outDir ?? undefined,
    logger: {
      silent,
      // TODO V5: verbose is deprecated and should be removed
      debug: debug || verbose,
    },
    artifacts: { contentTypes: true, components: true },
  });

  await app.destroy();
};

/**
 * `$ strapi ts:generate-types`
 */
const command: StrapiCommand = () => {
  return createCommand('ts:generate-types')
    .description(`Generate TypeScript typings for your schemas`)
    .option('--verbose', `[DEPRECATED] The verbose option has been replaced by debug`, false)
    .option('-d, --debug', `Run the generation with debug messages`, false)
    .option('-s, --silent', `Run the generation silently, without any output`, false)
    .option(
      '-o, --out-dir <outDir>',
      'Specify a relative root directory in which the definitions will be generated. Changing this value might break types exposed by Strapi that relies on generated types.'
    )
    .action(runAction('ts:generate-types', action));
};

export { action, command };
