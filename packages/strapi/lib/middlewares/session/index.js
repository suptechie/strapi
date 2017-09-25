'use strict';

/**
 * Module dependencies
 */

// Core modules
const path = require('path');

// Public node modules.
const _ = require('lodash');

/**
 * Session hook
 */

module.exports = strapi => {
  const hook = {
    /**
     * Default options
     */

    defaults: {
      session: {
        enabled: true,
        key: 'strapi.sid',
        prefix: 'strapi:sess:',
        ttl: 24 * 60 * 60 * 1000, // One day in ms
        rolling: false,
        secretKeys: ['mySecretKey1', 'mySecretKey2'],
        cookie: {
          path: '/',
          httpOnly: true,
          maxAge: 24 * 60 * 60 * 1000, // One day in ms
          rewrite: true,
          signed: false
        }
      }
    },

    /**
     * Initialize the hook
     */

    initialize: function(cb) {
      strapi.app.keys =
        _.get(strapi.config.middleware.settings.session, 'secretKeys') ||
        strapi.config.hooks.session.secretKeys;

      if (
        strapi.config.middleware.settings.session.hasOwnProperty('client') &&
        _.isString(strapi.config.middleware.settings.session.client)
      ) {
        const store = hook.defineStore(strapi.config.middleware.settings.session);

        if (!_.isEmpty(store)) {
          try {
            // Options object contains the defined store, the custom hooks configurations
            // and also the function which are located to `./config/functions/session.js`
            const options = _.assign(
              {
                store
              },
              strapi.config.hook.session,
              _.pick(strapi.config.middleware.settings.session, [
                'genSid',
                'errorHandler',
                'valid',
                'beforeSave'
              ])
            );

            strapi.app.use(
              strapi.koaMiddlewares.convert(
                strapi.koaMiddlewares.genericSession(options)
              )
            );
            strapi.app.use((ctx, next) => {
              ctx.state = ctx.state || {};
              ctx.state.session = ctx.session || {};

              return next();
            });
          } catch (err) {
            return cb(err);
          }
        }
      }

      cb();
    },

    defineStore: session => {
      if (_.isEmpty(_.get(session, 'client'))) {
        return strapi.log.error('(middleware:session) please provide a valid client to store session');
      } else if (_.isEmpty(_.get(session, 'settings'))) {
        return strapi.log.error('(middleware:session) please provide settings for the session store');
      }

      // Define correct store name to avoid require to failed.
      switch (session.client.toLowerCase()) {
        case 'redis': {
          const store = hook.requireStore('redis');

          session.settings.db = session.settings.database;

          return store(session.settings);
        }
        case 'mysql': {
          const Store = hook.requireStore('mysql-session');

          return new Store(session.settings);
        }
        case 'mongo': {
          const Store = hook.requireStore('generic-session-mongo');

          session.settings.db = session.settings.database;

          return new Store(session.settings);
        }
        case 'postgresql': {
          const Store = hook.requireStore('pg-session');

          return new Store(session.settings, session.options);
        }
        case 'rethink': {
          const Store = hook.requireStore('generic-session-rethinkdb');

          session.settings.dbName = session.settings.database;
          session.settings.tableName = session.settings.table;

          const sessionStore = new Store({
            connection: session.settings
          });

          // Create the DB, tables and indexes to store sessions.
          sessionStore.setup();

          return sessionStore;
        }
        case 'sqlite': {
          const Store = hook.requireStore('sqlite3-session');

          return new Store(session.fileName, session.options);
        }
        case 'sequelize': {
          const Store = hook.requireStore('generic-session-sequelize');

          // Sequelize needs to be instantiated.
          if (!_.isObject(strapi.sequelize)) {
            return null;
          }

          return new Store(strapi.sequelize, session.options);
        }
        default: {
          return null;
        }
      }
    },

    requireStore: store => {
      try {
        return require(path.resolve(
          strapi.config.appPath,
          'node_modules',
          'koa-' + store
        ));
      } catch (err) {
        throw err;
      }
    }
  };

  return hook;
};
