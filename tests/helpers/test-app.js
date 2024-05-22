'use strict';

const path = require('path');
const fs = require('fs');
const { rimraf } = require('rimraf');
const execa = require('execa');
const generateNew = require('../../packages/generators/app/dist/generate-new');

/**
 * Deletes a test app
 * @param {string} appPath - name of the app / folder where the app is located
 */
const cleanTestApp = async (appPath) => {
  await rimraf(path.resolve(appPath));
};

/**
 * Runs strapi generate new
 * @param {Object} options - Options
 * @param {string} options.appPath - Name of the app that will be created (also the name of the folder)
 * @param {database} options.database - Arguments to create the testApp with the provided database params
 */
const generateTestApp = async ({ appPath, database, template, link = false }) => {
  const scope = {
    database,
    rootPath: path.resolve(appPath),
    name: path.basename(appPath),
    // disable quickstart run app after creation
    runQuickstartApp: false,
    // use package version as strapiVersion (all packages have the same version);
    strapiVersion: require(path.resolve(__dirname, '../../packages/core/strapi/package.json'))
      .version,
    debug: false,
    quick: false,
    uuid: undefined,
    deviceId: null,
    // use yarn if available and --use-npm isn't true
    useYarn: true,
    installDependencies: false,
    strapiDependencies: [
      '@strapi/strapi',
      '@strapi/plugin-users-permissions',
      '@strapi/plugin-graphql',
      '@strapi/plugin-documentation',
      '@strapi/plugin-cloud',
    ],
    additionalsDependencies: {
      react: '18.2.0',
      'react-dom': '18.2.0',
      'react-router-dom': '^6.0.0',
      'styled-components': '^6.0.0',
    },
    template: template ? path.resolve(template) : template,
  };

  await generateNew(scope);
  if (link) {
    await linkPackages(scope);
  }
};

const linkPackages = async (scope) => {
  fs.writeFileSync(path.join(scope.rootPath, 'yarn.lock'), '');

  await execa('node', [path.join(__dirname, '../..', 'scripts', 'yalc-link.js')], {
    cwd: scope.rootPath,
    stdio: 'inherit',
  });
};

/**
 * Runs a test app
 * @param {string} appPath - name of the app / folder where the app is located
 */
const runTestApp = async (appPath) => {
  const cmdContext = {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..', appPath),
    env: {
      // if STRAPI_LICENSE is in the env the test will run in ee automatically
      STRAPI_DISABLE_EE: !process.env.STRAPI_LICENSE,
      FORCE_COLOR: 1,
      JWT_SECRET: 'aSecret',
    },
  };

  try {
    await execa('yarn', ['strapi', 'build'], cmdContext);
    await execa('yarn', ['strapi', 'start'], cmdContext);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = {
  cleanTestApp,
  generateTestApp,
  runTestApp,
};
