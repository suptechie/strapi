'use strict';

module.exports = strapi => {
  return {
    initialize() {
      strapi.server.use(async (ctx, next) => {
        await next();

        ctx.set(
          'X-Powered-By',
          strapi.config.get('middleware.settings.poweredBy.value', 'Strapi <strapi.io>')
        );
      });
    },
  };
};
