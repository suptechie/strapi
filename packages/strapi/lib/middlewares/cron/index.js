'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');
const cron = require('node-schedule');

/**
 * CRON hook
 */

module.exports = strapi => {
  return {
    /**
     * Default options
     */

    defaults: {
      cron: {}
    },

    /**
     * Initialize the hook
     */

    initialize: function(cb) {
      if (
        _.isPlainObject(strapi.config.middleware.settings.cron) &&
        !_.isEmpty(strapi.config.middleware.settings.cron)
      ) {
        _.forEach(_.keys(strapi.config.middleware.settings.cron), task => {
          cron.scheduleJob(task, strapi.config.middleware.settings.cron[task]);
        });
      }

      cb();
    }
  };
};
