'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const Boom = require('boom');

// Local utilities.
const responsesPolicy = require('../responses/policy');

// Strapi utilities.
const joijson = require('strapi-utils').joijson;

/**
 * Router hook
 */

module.exports = strapi => {
  const composeEndpoint = require('./utils/composeEndpoint')(strapi);

  return {
    /**
     * Default options
     */

    defaults: {
      router: {
        enabled: true,
        prefix: '',
        routes: {}
      }
    },

    /**
     * Initialize the hook
     */

    initialize: function(cb) {
      const Joi = strapi.koaMiddlewares.joiRouter.Joi;
      const builder = joijson.builder(Joi);

      // Initialize the router.
      if (!strapi.router) {
        strapi.router = strapi.koaMiddlewares.joiRouter();
        strapi.router.prefix(strapi.config.middleware.settings.router.prefix || '');
      }

      // Add response policy to the global variable.
      _.set(strapi.config.policies, 'responsesPolicy', responsesPolicy);

      _.forEach(strapi.config.routes, value => {
        composeEndpoint(value, null, strapi.router)(cb);
      });

      if (!_.isEmpty(_.get(strapi.admin, 'config.routes', false))) {
        // Create router for admin.
        // Prefix router with the admin's name.
        const router = strapi.koaMiddlewares.joiRouter();

        _.forEach(strapi.admin.config.routes, value => {
          composeEndpoint(value, null, router)(cb);
        });

        router.prefix(strapi.config.admin.path || `/${strapi.config.paths.admin}`);

        // TODO:
        // - Mount on main router `strapi.router.use(routerAdmin.middleware());`

        // Mount admin router on Strapi router
        strapi.app.use(router.middleware());
      }

      if (strapi.plugins) {
        // Parse each plugin's routes.
        _.forEach(strapi.plugins, (plugin, name) => {
          const router = strapi.koaMiddlewares.joiRouter();

          // Exclude routes with prefix.
          const excludedRoutes = _.omitBy(plugin.config.routes, o => !o.hasOwnProperty('prefix'));

          _.forEach(_.omit(plugin.config.routes, _.keys(excludedRoutes)), value => {
            composeEndpoint(value, name, router)(cb);
          });

          router.prefix('/' + name);

          // /!\ Could override main router's routes.
          if (!_.isEmpty(excludedRoutes)) {
            _.forEach(excludedRoutes, value => {
              composeEndpoint(value, name, strapi.router)(cb)
            });
          }

          // TODO:
          // - Mount on main router `strapi.router.use(router.middleware());`

          // Mount plugin router
          strapi.app.use(router.middleware());
        });
      }

      // Let the router use our routes and allowed methods.
      strapi.app.use(strapi.router.middleware());
      strapi.app.use(
        strapi.router.router.allowedMethods({
          throw: false,
          notImplemented: () => Boom.notImplemented(),
          methodNotAllowed: () => Boom.methodNotAllowed()
        })
      );

      strapi.app.use(responsesPolicy);

      cb();
    }
  };
};
