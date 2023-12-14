'use strict';

const path = require('path');
const execa = require('execa');
const fs = require('node:fs/promises');
const yargs = require('yargs');

const chalk = require('chalk');
const { cleanTestApp, generateTestApp } = require('../helpers/test-app');
const { createConfig } = require('../../playwright.base.config');

const cwd = path.resolve(__dirname, '../..');
const testAppDirectory = path.join(cwd, 'test-apps', 'e2e');

yargs
  .parserConfiguration({
    /**
     * This lets us pass any other arguments to playwright
     * e.g. the name of a specific test or the project we want to run
     */
    'unknown-options-as-args': true,
  })
  .command({
    command: '*',
    description: 'run the E2E test suite',
    async builder(yarg) {
      const domains = await fs.readdir(path.join(cwd, 'e2e', 'tests'));

      yarg.option('concurrency', {
        alias: 'c',
        type: 'number',
        default: domains.length,
        describe:
          'Number of concurrent test apps to run, a test app runs an entire test suite domain',
      });

      yarg.option('domains', {
        alias: 'd',
        describe: 'Run a specific test suite domain',
        type: 'array',
        choices: domains,
        default: domains,
      });

      yarg.option('setup', {
        alias: 'f',
        describe: 'Force the setup process of the test apps',
        type: 'boolean',
        default: false,
      });
    },
    async handler(argv) {
      try {
        const { concurrency, domains, setup } = argv;

        /**
         * Publshing all pacakges to the yalc store
         */
        await execa('node', [path.join(__dirname, '../..', 'scripts', 'yalc-publish.js')], {
          stdio: 'inherit',
        });

        /**
         * We don't need to spawn more apps than we have domains,
         * but equally if someone sets the concurrency to 1
         * then we should only spawn one and run every domain on there.
         */
        const testAppsToSpawn = Math.min(domains.length, concurrency);

        if (testAppsToSpawn === 0) {
          throw new Error('No test apps to spawn');
        }

        const testAppPaths = Array.from({ length: testAppsToSpawn }, (_, i) =>
          path.join(testAppDirectory, `test-app-${i}`)
        );

        let currentTestApps = [];

        try {
          currentTestApps = await fs.readdir(testAppDirectory);
        } catch (err) {
          // no test apps exist, okay to fail silently
        }

        /**
         * If we don't have enough test apps, we make enough.
         * You can also force this setup if desired, e.g. you
         * update the app-template.
         */
        if (setup || currentTestApps.length < testAppsToSpawn) {
          /**
           * this will effectively clean the entire directory before hand
           * as opposed to cleaning the ones we aim to spawn.
           */
          await Promise.all(
            currentTestApps.map(async (testAppName) => {
              const appPath = path.join(testAppDirectory, testAppName);
              console.log(`cleaning test app at path: ${chalk.bold(appPath)}`);
              await cleanTestApp(appPath);
            })
          );

          await Promise.all(
            testAppPaths.map(async (appPath) => {
              console.log(`generating test apps at path: ${chalk.bold(appPath)}`);
              await generateTestApp({
                appPath,
                database: {
                  client: 'sqlite',
                  connection: {
                    filename: './.tmp/data.db',
                  },
                  useNullAsDefault: true,
                },
                template: path.join(cwd, 'e2e', 'app-template'),
                link: true,
              });
              /**
               * Because we're running multiple test apps at the same time
               * and the env file is generated by the generator with no way
               * to override it, we manually remove the PORT key/value so when
               * we set it further down for each playwright instance it works.
               */
              const pathToEnv = path.join(appPath, '.env');
              const envFile = (await fs.readFile(pathToEnv)).toString();
              const envWithoutPort = envFile.replace('PORT=1337', '');
              await fs.writeFile(pathToEnv, envWithoutPort);
            })
          );

          console.log(
            `${chalk.green('Successfully')} setup test apps for the following domains: ${chalk.bold(
              domains.join(', ')
            )}`
          );
        } else {
          console.log(
            `Skipping setting up test apps, use ${chalk.bold('--setup')} to force the setup process`
          );
        }

        /**
         * You can't change the webserver configuration of playwright directly so they'd
         * all be looking at the same test app which we don't want, instead we'll generate
         * a playwright config based off the base one
         */
        const chunkedDomains = domains.reduce((acc, _, i) => {
          if (i % testAppsToSpawn === 0) acc.push(domains.slice(i, i + testAppsToSpawn));
          return acc;
        }, []);

        for (let i = 0; i < chunkedDomains.length; i++) {
          const domains = chunkedDomains[i];

          await Promise.all(
            domains.map(async (domain, j) => {
              const testAppPath = testAppPaths[j];
              const port = 8000 + j;

              const pathToPlaywrightConfig = path.join(testAppPath, 'playwright.config.js');

              console.log(
                `Creating playwright config for domain: ${chalk.blue(
                  domain
                )}, at path: ${chalk.yellow(testAppPath)}`
              );

              const config = createConfig({
                testDir: path.join(cwd, 'e2e', 'tests', domain),
                port,
                appDir: testAppPath,
              });

              const configFileTemplate = `
const config = ${JSON.stringify(config)}

module.exports = config
              `;

              await fs.writeFile(pathToPlaywrightConfig, configFileTemplate);

              console.log(`Running ${chalk.blue(domain)} e2e tests`);

              await execa(
                'yarn',
                ['playwright', 'test', '--config', pathToPlaywrightConfig, ...argv._],
                {
                  stdio: 'inherit',
                  cwd,
                  env: {
                    PORT: port,
                    HOST: '127.0.0.1',
                  },
                }
              );
            })
          );
        }
      } catch (err) {
        console.error(chalk.red('Error running e2e tests:'));
        /**
         * This is a ExecaError, if we were in TS we could do `instanceof`
         */
        if (err.shortMessage) {
          console.error(err.shortMessage);
          process.exit(1);
        }

        console.error(err);
        process.exit(1);
      }
    },
  })
  .command({
    command: 'clean',
    description: 'clean the test app directory of all test apps',
    async handler() {
      try {
        const currentTestApps = await fs.readdir(testAppDirectory);

        if (currentTestApps.length === 0) {
          console.log('No test apps to clean');
          return;
        }

        await Promise.all(
          currentTestApps.map(async (testAppName) => {
            const appPath = path.join(testAppDirectory, testAppName);
            console.log(`cleaning test app at path: ${chalk.bold(appPath)}`);
            await cleanTestApp(appPath);
          })
        );
      } catch (err) {
        console.error(chalk.red('Error cleaning test apps:'));
        console.error(err);
        process.exit(1);
      }
    },
  })
  .help()
  .parse();
