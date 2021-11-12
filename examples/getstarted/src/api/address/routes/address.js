'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::address.address', {
  prefix: '/my-prefix',
  config: {
    find: {
      auth: false,
    },
  },
  only: ['find', 'findOne'],
  // except: [],
});
