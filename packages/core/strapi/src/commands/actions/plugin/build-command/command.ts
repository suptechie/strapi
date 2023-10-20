import { forceOption } from '../../../utils/commander';
import type { StrapiCommand } from '../../../types';
import { runAction } from '../../../utils/helpers';
import action from './action';

/**
 * `$ strapi plugin:build`
 */
const command: StrapiCommand = ({ command }) => {
  command
    .command('plugin:build')
    .description('Bundle your strapi plugin for publishing.')
    .addOption(forceOption)
    .option('-d, --debug', 'Enable debugging mode with verbose logs', false)
    .option('--silent', "Don't log anything", false)
    .option('--sourcemap', 'produce sourcemaps', false)
    .option('--minify', 'minify the output', false)
    .action(runAction('plugin:build', action));
};

export default command;
