#!/usr/bin/env node

'use strict';

// FIXME
/* eslint-disable import/extensions */
const _ = require('lodash');
const path = require('path');
const resolveCwd = require('resolve-cwd');
const { yellow } = require('chalk');
const { Command, Option } = require('commander');
const inquirer = require('inquirer');

const program = new Command();

const packageJSON = require('../package.json');
const {
  parseInputList,
  promptEncryptionKey,
  confirmKeyValue,
} = require('../lib/commands/utils/commander');

const checkCwdIsStrapiApp = (name) => {
  const logErrorAndExit = () => {
    console.log(
      `You need to run ${yellow(
        `strapi ${name}`
      )} in a Strapi project. Make sure you are in the right directory.`
    );
    process.exit(1);
  };

  try {
    const pkgJSON = require(`${process.cwd()}/package.json`);
    if (!_.has(pkgJSON, 'dependencies.@strapi/strapi')) {
      logErrorAndExit(name);
    }
  } catch (err) {
    logErrorAndExit(name);
  }
};

const getLocalScript =
  (name) =>
  (...args) => {
    checkCwdIsStrapiApp(name);

    const cmdPath = resolveCwd.silent(`@strapi/strapi/lib/commands/${name}`);
    if (!cmdPath) {
      console.log(
        `Error loading the local ${yellow(
          name
        )} command. Strapi might not be installed in your "node_modules". You may need to run "yarn install".`
      );
      process.exit(1);
    }

    const script = require(cmdPath);

    Promise.resolve()
      .then(() => {
        return script(...args);
      })
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  };

// Initial program setup
program.storeOptionsAsProperties(false).allowUnknownOption(true);

program.helpOption('-h, --help', 'Display help for command');
program.addHelpCommand('help [command]', 'Display help for command');

// `$ strapi version` (--version synonym)
program.version(packageJSON.version, '-v, --version', 'Output the version number');
program
  .command('version')
  .description('Output the version of Strapi')
  .action(() => {
    process.stdout.write(`${packageJSON.version}\n`);
    process.exit(0);
  });

// `$ strapi console`
program
  .command('console')
  .description('Open the Strapi framework console')
  .action(getLocalScript('console'));

// `$ strapi new`
program
  .command('new <directory>')
  .option('--no-run', 'Do not start the application after it is created')
  .option('--use-npm', 'Force usage of npm instead of yarn to create the project')
  .option('--debug', 'Display database connection errors')
  .option('--quickstart', 'Create quickstart app')
  .option('--dbclient <dbclient>', 'Database client')
  .option('--dbhost <dbhost>', 'Database host')
  .option('--dbport <dbport>', 'Database port')
  .option('--dbname <dbname>', 'Database name')
  .option('--dbusername <dbusername>', 'Database username')
  .option('--dbpassword <dbpassword>', 'Database password')
  .option('--dbssl <dbssl>', 'Database SSL')
  .option('--dbfile <dbfile>', 'Database file path for sqlite')
  .option('--dbforce', 'Allow overwriting existing database content')
  .option('-ts, --typescript', 'Create a typescript project')
  .description('Create a new application')
  .action(require('../lib/commands/new'));

// `$ strapi start`
program
  .command('start')
  .description('Start your Strapi application')
  .action(getLocalScript('start'));

// `$ strapi develop`
program
  .command('develop')
  .alias('dev')
  .option('--no-build', 'Disable build')
  .option('--watch-admin', 'Enable watch', false)
  .option('--polling', 'Watch for file changes in network directories', false)
  .option('--browser <name>', 'Open the browser', true)
  .description('Start your Strapi application in development mode')
  .action(getLocalScript('develop'));

// $ strapi generate
program
  .command('generate')
  .description('Launch the interactive API generator')
  .action(() => {
    checkCwdIsStrapiApp('generate');
    process.argv.splice(2, 1);
    require('@strapi/generators').runCLI();
  });

// `$ strapi generate:template <directory>`
program
  .command('templates:generate <directory>')
  .description('Generate template from Strapi project')
  .action(getLocalScript('generate-template'));

program
  .command('build')
  .option('--no-optimization', 'Build the admin app without optimizing assets')
  .description('Build the strapi admin app')
  .action(getLocalScript('build'));

// `$ strapi install`
program
  .command('install [plugins...]')
  .description('Install a Strapi plugin')
  .action(getLocalScript('install'));

// `$ strapi uninstall`
program
  .command('uninstall [plugins...]')
  .description('Uninstall a Strapi plugin')
  .option('-d, --delete-files', 'Delete files', false)
  .action(getLocalScript('uninstall'));

//   `$ strapi watch-admin`
program
  .command('watch-admin')
  .option('--browser <name>', 'Open the browser', true)
  .description('Start the admin development server')
  .action(getLocalScript('watchAdmin'));

program
  .command('configuration:dump')
  .alias('config:dump')
  .description('Dump configurations of your application')
  .option('-f, --file <file>', 'Output file, default output is stdout')
  .option('-p, --pretty', 'Format the output JSON with indentation and line breaks', false)
  .action(getLocalScript('configurationDump'));

program
  .command('configuration:restore')
  .alias('config:restore')
  .description('Restore configurations of your application')
  .option('-f, --file <file>', 'Input file, default input is stdin')
  .option('-s, --strategy <strategy>', 'Strategy name, one of: "replace", "merge", "keep"')
  .action(getLocalScript('configurationRestore'));

// Admin
program
  .command('admin:create-user')
  .alias('admin:create')
  .description('Create a new admin')
  .option('-e, --email <email>', 'Email of the new admin')
  .option('-p, --password <password>', 'Password of the new admin')
  .option('-f, --firstname <first name>', 'First name of the new admin')
  .option('-l, --lastname <last name>', 'Last name of the new admin')
  .action(getLocalScript('admin-create'));

program
  .command('admin:reset-user-password')
  .alias('admin:reset-password')
  .description("Reset an admin user's password")
  .option('-e, --email <email>', 'The user email')
  .option('-p, --password <password>', 'New password for the user')
  .action(getLocalScript('admin-reset'));

program
  .command('routes:list')
  .description('List all the application routes')
  .action(getLocalScript('routes/list'));

program
  .command('middlewares:list')
  .description('List all the application middlewares')
  .action(getLocalScript('middlewares/list'));

program
  .command('policies:list')
  .description('List all the application policies')
  .action(getLocalScript('policies/list'));

program
  .command('content-types:list')
  .description('List all the application content-types')
  .action(getLocalScript('content-types/list'));

program
  .command('hooks:list')
  .description('List all the application hooks')
  .action(getLocalScript('hooks/list'));

program
  .command('services:list')
  .description('List all the application services')
  .action(getLocalScript('services/list'));

program
  .command('controllers:list')
  .description('List all the application controllers')
  .action(getLocalScript('controllers/list'));

//    `$ strapi opt-out-telemetry`
program
  .command('telemetry:disable')
  .description('Disable anonymous telemetry and metadata sending to Strapi analytics')
  .action(getLocalScript('opt-out-telemetry'));

//    `$ strapi opt-in-telemetry`
program
  .command('telemetry:enable')
  .description('Enable anonymous telemetry and metadata sending to Strapi analytics')
  .action(getLocalScript('opt-in-telemetry'));

program
  .command('ts:generate-types')
  .description(`Generate TypeScript typings for your schemas`)
  .option(
    '-o, --out-dir <outDir>',
    'Specify a relative directory in which the schemas definitions will be generated'
  )
  .option('-f, --file <file>', 'Specify a filename to store the schemas definitions')
  .option('--verbose', `Display more information about the types generation`, false)
  .option('-s, --silent', `Run the generation silently, without any output`, false)
  .action(getLocalScript('ts/generate-types'));

// `$ strapi export`
program
  .command('export')
  .description('Export data from Strapi to file')
  .addOption(
    new Option('--no-encrypt', `Disable 'aes-128-ecb' encryption of the output file`).default(true)
  )
  .addOption(new Option('--no-compress', 'Disable gzip compression of output file').default(true))
  .addOption(
    new Option('--key <string>', 'Provide encryption key in command instead of using a prompt')
  )
  .addOption(
    new Option(
      '--max-size-jsonl <max MB per internal backup file>',
      'split internal jsonl files when exceeding max size in MB'
    )
      .argParser(parseFloat)
      .default(256)
  )
  .addOption(new Option('-f, --file <file>', 'name to use for exported file (without extensions)'))
  .allowExcessArguments(false)
  .hook('preAction', promptEncryptionKey)
  // validate inputs
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (!opts.maxSizeJsonl) {
      console.error('Invalid max-size-jsonl provided. Must be a number value.');
      process.exit(1);
    }
  })
  .action(getLocalScript('transfer/export'));

// `$ strapi import`
program
  .command('import')
  .description('Import data from file to Strapi')
  .addOption(
    new Option('--conflictStrategy <conflictStrategy>', 'Which strategy to use for ID conflicts')
      .choices(['restore', 'abort', 'keep', 'replace'])
      .default('restore')
  )
  .addOption(
    new Option(
      '--schemaComparison <schemaComparison>',
      'exact requires every field to match, strict requires Strapi version and content type schema fields do not break, subset requires source schema to exist in destination, bypass skips checks',
      parseInputList
    )
      .choices(['exact', 'strict', 'subset', 'bypass'])
      .default('exact')
  )
  .requiredOption(
    '-f, --file <file>',
    'path and filename to the Strapi export file you want to import'
  )
  .addOption(
    new Option('-k, --key <string>', 'Provide encryption key in command instead of using a prompt')
  )
  .allowExcessArguments(false)
  .hook('preAction', async (thisCommand) => {
    const opts = thisCommand.opts();
    const ext = path.extname(String(opts.file));

    // check extension to guess if we should prompt for key
    if (ext === '.enc') {
      if (!opts.key) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            message: 'Please enter your decryption key',
            name: 'key',
          },
        ]);
        if (!answers.key?.length) {
          console.log('No key entered, aborting import.');
          process.exit(0);
        }
        opts.key = answers.key;
      }
    }
  })
  .hook(
    'preAction',
    confirmKeyValue(
      'conflictStrategy',
      'restore',
      "Using strategy 'restore' will delete all data in your database. Are you sure you want to proceed?"
    )
  )
  .action(getLocalScript('transfer/import'));

program.parseAsync(process.argv);
