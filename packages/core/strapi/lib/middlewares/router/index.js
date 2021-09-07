'use strict';

const _ = require('lodash');
const { toLower } = require('lodash/fp');

const createRouteScopeGenerator = namespace => route => {
  const prefix = namespace.endsWith('::') ? namespace : `${namespace}.`;

  if (typeof route.handler === 'string') {
    const [controller, action] = route.handler.split('.');

    _.defaultsDeep(route.config, {
      auth: {
        scope: `${prefix}${controller}.${toLower(action)}`,
      },
    });
  }
};

module.exports = strapi => {
  const registerAdminRoutes = () => {
    const generateRouteScope = createRouteScopeGenerator(`admin::`);

    strapi.admin.routes.forEach(route => {
      generateRouteScope(route);
      route.info = { pluginName: 'admin' };
    });

    strapi.server.routes({
      type: 'admin',
      prefix: '/admin',
      routes: strapi.admin.routes,
    });
  };

  const registerPluginRoutes = () => {
    for (const pluginName in strapi.plugins) {
      const plugin = strapi.plugins[pluginName];

      const generateRouteScope = createRouteScopeGenerator(`plugin::${pluginName}`);

      if (Array.isArray(plugin.routes)) {
        plugin.routes.forEach(route => {
          generateRouteScope(route);
          route.info = { pluginName };
        });

        strapi.server.routes({
          type: 'admin',
          prefix: `/${pluginName}`,
          routes: plugin.routes,
        });
      } else {
        _.forEach(plugin.routes, router => {
          router.type = router.type || 'admin';
          router.prefix = `/${pluginName}`;
          router.routes.forEach(route => {
            generateRouteScope(route);
            route.info = { pluginName };
          });

          strapi.server.routes(router);
        });
      }
    }
  };

  const registerAPIRoutes = () => {
    for (const apiName in strapi.api) {
      const api = strapi.api[apiName];

      const generateRouteScope = createRouteScopeGenerator(`api::${apiName}`);

      _.forEach(api.routes, router => {
        // TODO: remove once auth setup
        // pass meta down to compose endpoint
        router.type = 'content-api';
        router.routes.forEach(route => {
          generateRouteScope(route);
          route.info = { apiName };
        });

        return strapi.server.routes(router);
      });
    }
  };

  return {
    initialize() {
      registerAdminRoutes();
      registerAPIRoutes();
      registerPluginRoutes();
    },
  };
};
