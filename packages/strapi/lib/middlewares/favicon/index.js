'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');

// Public node modules.
const _ = require('lodash');

/**
 * Favicon hook
 */

module.exports = strapi => {
  return {
    /**
     * Default options
     */

    defaults: {
      favicon: {
        path: 'favicon.ico',
        maxAge: 86400000
      }
    },

    /**
     * Initialize the hook
     */

    initialize: function(cb) {
      if (
        _.isPlainObject(strapi.config.middleware.settings.favicon) &&
        !_.isEmpty(strapi.config.middleware.settings.favicon)
      ) {
        strapi.app.use(
          strapi.koaMiddlewares.favicon(
            path.resolve(strapi.config.appPath, strapi.config.middleware.settings.favicon.path),
            {
              maxAge: strapi.config.middleware.settings.favicon.maxAge
            }
          )
        );
      }

      cb();
    }
  };
};
