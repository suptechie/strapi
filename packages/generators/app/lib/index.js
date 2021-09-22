'use strict';

const { join, resolve, basename } = require('path');
const os = require('os');
const crypto = require('crypto');
const { machineIdSync } = require('node-machine-id');
const uuid = require('uuid/v4');
const sentry = require('@sentry/node');
// FIXME
/* eslint-disable import/extensions */
const hasYarn = require('./utils/has-yarn');
const checkRequirements = require('./utils/check-requirements');
const { trackError, captureException } = require('./utils/usage');
const parseDatabaseArguments = require('./utils/parse-db-arguments');
const generateNew = require('./generate-new');

sentry.init({
  dsn: 'https://841d2b2c9b4d4b43a4cde92794cb705a@sentry.io/1762059',
});

// TODO: to remove after the templates are updated for V4
const warnTemplatesAreDisabled = cliArguments => {
  if (cliArguments.template) {
    console.log(
      '❌ Templates have been disabled for the Beta version of V4 and will be re-enabled soon!'
    );
    process.exit();
  }
};

module.exports = (projectDirectory, cliArguments) => {
  warnTemplatesAreDisabled(cliArguments);

  checkRequirements();

  const rootPath = resolve(projectDirectory);

  const tmpPath = join(os.tmpdir(), `strapi${crypto.randomBytes(6).toString('hex')}`);

  const useNpm = cliArguments.useNpm !== undefined;

  const scope = {
    rootPath,
    name: basename(rootPath),
    // disable quickstart run app after creation
    runQuickstartApp: cliArguments.run === false ? false : true,
    // use pacakge version as strapiVersion (all packages have the same version);
    strapiVersion: require('../package.json').version,
    debug: cliArguments.debug !== undefined,
    quick: cliArguments.quickstart,
    template: cliArguments.template,
    packageJsonStrapi: {
      template: cliArguments.template,
      starter: cliArguments.starter,
    },
    uuid: (process.env.STRAPI_UUID_PREFIX || '') + uuid(),
    docker: process.env.DOCKER === 'true',
    deviceId: machineIdSync(),
    tmpPath,
    // use yarn if available and --use-npm isn't true
    useYarn: !useNpm && hasYarn(),
    installDependencies: true,
    strapiDependencies: [
      '@strapi/strapi',
      '@strapi/plugin-users-permissions',
      '@strapi/plugin-i18n',
    ],
    additionalsDependencies: {},
  };

  sentry.configureScope(function(sentryScope) {
    const tags = {
      os_type: os.type(),
      os_platform: os.platform(),
      os_release: os.release(),
      strapi_version: scope.strapiVersion,
      node_version: process.version,
      docker: scope.docker,
    };

    Object.keys(tags).forEach(tag => {
      sentryScope.setTag(tag, tags[tag]);
    });
  });

  parseDatabaseArguments({ scope, args: cliArguments });
  initCancelCatcher(scope);

  return generateNew(scope).catch(error => {
    console.error(error);
    return captureException(error).then(() => {
      return trackError({ scope, error }).then(() => {
        process.exit(1);
      });
    });
  });
};

function initCancelCatcher() {
  // Create interface for windows user to let them quit the program.
  if (process.platform === 'win32') {
    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.on('SIGINT', function() {
      process.emit('SIGINT');
    });
  }

  process.on('SIGINT', () => {
    process.exit(1);
  });
}
