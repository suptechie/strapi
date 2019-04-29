#!/usr/bin/env node

'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');
const cluster = require('cluster');
const strapi = require('../strapi');

// Public dependencies
const _ = require('lodash');
const fs = require('fs-extra');
const { cyan } = require('chalk');
const chokidar = require('chokidar');
const strapiAdmin = require('strapi-admin');

// Logger.
const { cli, logger } = require('strapi-utils');

/**
 * `$ strapi start`
 *
 * Expose method which starts the appropriate instance of Strapi
 * (fire up the application in our working directory).
 */

module.exports = async function(dir = '.') {
  process.env.NODE_ENV = 'development';

  // Check that we're in a valid Strapi project.
  if (!cli.isStrapiApp()) {
    return console.log(
      `⛔️ ${cyan('strapi start')} can only be used inside a Strapi project.`
    );
  }

  const appPath = path.join(process.cwd(), dir);

  // Require server configurations
  const server = require(path.resolve(
    appPath,
    'config',
    'environments',
    'development',
    'server.json'
  ));

  if (!fs.existsSync(path.resolve(appPath, 'build'))) {
    await strapiAdmin.build({
      dir: process.cwd(),
      env: 'production',
    });
  } else {
  }

  try {
    const strapiInstance = strapi({ appPath });

    if (_.get(server, 'autoReload.enabled') === true) {
      if (cluster.isMaster) {
        cluster.on('message', (worker, message) => {
          switch (message) {
            case 'reload':
              strapiInstance.log.info('The server is restarting\n');
              worker.send('isKilled');
              break;
            case 'kill':
              worker.kill();
              cluster.fork();
              break;
            case 'stop':
              worker.kill();
              process.exit(1);
              break;
            default:
              return;
          }
        });

        cluster.fork();
      }

      if (cluster.isWorker) {
        watchFileChanges({ appPath, strapiInstance });

        process.on('message', message => {
          switch (message) {
            case 'isKilled':
              strapiInstance.server.destroy(() => {
                process.send('kill');
              });
              break;
            default:
            // Do nothing.
          }
        });

        return strapiInstance.start();
      } else {
        return;
      }
    }

    strapiInstance.start();
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
};

/**
 * Init file watching to auto restart strapi app
 * @param {Object} options - Options object
 * @param {string} options.appPath - This is the path where the app is located, the watcher will watch the files under this folder
 * @param {Strapi} options.strapi - Strapi instance
 */
function watchFileChanges({ appPath, strapiInstance }) {
  const restart = () => {
    if (
      strapiInstance.reload.isWatching &&
      !strapiInstance.reload.isReloading
    ) {
      strapiInstance.reload.isReloading = true;
      strapiInstance.reload();
    }
  };

  const watcher = chokidar.watch(appPath, {
    ignoreInitial: true,
    ignored: [
      /(^|[/\\])\../,
      /tmp/,
      '**/admin',
      '**/admin/**',
      '**/components',
      '**/components/**',
      '**/documentation',
      '**/documentation/**',
      '**/node_modules',
      '**/node_modules/**',
      '**/plugins.json',
      '**/index.html',
      '**/public',
      '**/public/**',
      '**/cypress',
      '**/cypress/**',
      '**/*.db*',
      '**/exports/**',
    ],
  });

  watcher
    .on('add', path => {
      strapiInstance.log.info(`File created: ${path}`);
      restart();
    })
    .on('change', path => {
      strapiInstance.log.info(`File changed: ${path}`);
      restart();
    })
    .on('unlink', path => {
      strapiInstance.log.info(`File deleted: ${path}`);
      restart();
    });
}
