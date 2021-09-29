'use strict';

const Koa = require('koa');
const Router = require('@koa/router');

const { createHTTPServer } = require('./http-server');
const { createRouteManager } = require('./routing');
const { createAdminAPI } = require('./admin-api');
const { createContentAPI } = require('./content-api');
const registerAllRoutes = require('./register-routes');
const registerMiddlewares = require('./register-middlewares');

const healthCheck = async ctx => {
  ctx.set('strapi', 'You are so French!');
  ctx.status = 204;
};

/**
 * @typedef Server
 *
 * @property {Koa} app
 * @property {http.Server} app
 */

/**
 *
 * @param {Strapi} strapi
 * @returns {Server}
 */
const createServer = strapi => {
  const app = new Koa({
    proxy: strapi.config.get('server.proxy'),
  });

  const router = new Router({
    // FIXME: this prefix can break the admin if not specified in the admin url
    prefix: strapi.config.get('middleware.settings.router.prefix', ''),
  });

  const routeManager = createRouteManager(strapi);

  const httpServer = createHTTPServer(strapi, app);

  const apis = {
    'content-api': createContentAPI(strapi),
    admin: createAdminAPI(strapi),
  };

  // init health check
  router.all('/_health', healthCheck);

  const state = {
    mounted: false,
  };

  return {
    app,
    router,
    httpServer,

    api(name) {
      return apis[name];
    },

    use(...args) {
      app.use(...args);
      return this;
    },

    routes(routes) {
      if (routes.type) {
        const api = apis[routes.type];
        if (!api) {
          throw new Error(`API ${routes.type} not found. Possible APIs are ${Object.keys(apis)}`);
        }

        apis[routes.type].routes(routes);
        return this;
      }

      routeManager.addRoutes(routes, router);
      return this;
    },

    mount() {
      state.mounted = true;

      Object.values(apis).forEach(api => api.mount(router));
      app.use(router.routes()).use(router.allowedMethods());

      return this;
    },

    async initRouting() {
      await registerAllRoutes(strapi);

      return this;
    },

    async initMiddlewares() {
      await registerMiddlewares(strapi);

      return this;
    },

    listRoutes() {
      const allRoutes = [...router.stack];

      Object.values(apis).forEach(api => {
        allRoutes.push(...api.listRoutes());
      });

      return allRoutes;
    },

    listen(...args) {
      if (!state.mounted) {
        this.mount();
      }

      return httpServer.listen(...args);
    },

    async destroy() {
      await httpServer.destroy();
    },
  };
};

module.exports = {
  createServer,
};
