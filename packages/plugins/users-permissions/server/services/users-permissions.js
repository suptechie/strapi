'use strict';

const _ = require('lodash');
const { filter, map, pipe, prop } = require('lodash/fp');

const { getService } = require('../utils');

const DEFAULT_PERMISSIONS = [
  { action: 'plugin::users-permissions.auth.admincallback', roleType: 'public' },
  { action: 'plugin::users-permissions.auth.adminregister', roleType: 'public' },
  { action: 'plugin::users-permissions.auth.callback', roleType: 'public' },
  { action: 'plugin::users-permissions.auth.connect', roleType: null },
  { action: 'plugin::users-permissions.auth.forgotpassword', roleType: 'public' },
  { action: 'plugin::users-permissions.auth.resetpassword', roleType: 'public' },
  { action: 'plugin::users-permissions.auth.register', roleType: 'public' },
  { action: 'plugin::users-permissions.auth.emailconfirmation', roleType: 'public' },
  { action: 'plugin::users-permissions.user.me', roleType: null },
];

module.exports = ({ strapi }) => ({
  getPlugins(lang = 'en') {
    const request = require('request');
    return new Promise(resolve => {
      request(
        {
          uri: `https://marketplace.strapi.io/plugins?lang=${lang}`,
          json: true,
          timeout: 3000,
          headers: {
            'cache-control': 'max-age=3600',
          },
        },
        (err, response, body) => {
          if (err || response.statusCode !== 200) {
            return resolve([]);
          }

          resolve(body);
        }
      );
    });
  },

  getActions() {
    const actionMap = {};

    _.forEach(strapi.api, (api, apiName) => {
      const controllers = _.mapValues(api.controllers, controller => {
        return _.mapValues(controller, () => {
          return { enabled: false, policy: '' };
        });
      });

      actionMap[`api::${apiName}`] = { controllers };
    });

    _.forEach(strapi.plugins, (plugin, pluginName) => {
      const controllers = _.mapValues(plugin.controllers, controller => {
        return _.mapValues(controller, () => {
          return { enabled: false, policy: '' };
        });
      });

      actionMap[`plugin::${pluginName}`] = { controllers };
    });

    return actionMap;
  },

  async getRoutes() {
    // TODO: remove or refactor

    const applicationRoutes = [];

    _.forEach(strapi.api, api => {
      _.forEach(api.routes, route => {
        if (_.has(route, 'routes')) {
          applicationRoutes.push(...route.routes);
        } else {
          applicationRoutes.push(route);
        }
      });
    });

    const pluginsRoutes = {};

    _.forEach(strapi.plugins, (plugin, pluginName) => {
      const pluginRoutes = [];

      _.forEach(plugin.routes, route => {
        if (_.has(route, 'routes')) {
          pluginRoutes.push(
            ...route.routes.map(route => {
              const prefix = route.config && route.config.prefix;
              const path =
                prefix !== undefined ? `${prefix}${route.path}` : `/${pluginName}${route.path}`;

              return {
                ...route,
                path,
              };
            })
          );
        } else {
          const prefix = route.config && route.config.prefix;
          const path =
            prefix !== undefined ? `${prefix}${route.path}` : `/${pluginName}${route.path}`;

          pluginRoutes.push({
            ...route,
            path,
          });
        }
      });

      pluginsRoutes[pluginName] = pluginRoutes;
    });

    return _.merge({ application: applicationRoutes }, pluginsRoutes);
  },

  async updatePermissions() {
    const roles = await strapi.query('plugin::users-permissions.role').findMany();
    const dbPermissions = await strapi.query('plugin::users-permissions.permission').findMany();

    const permissionsFoundInDB = _.uniq(_.map(dbPermissions, 'action'));

    const appActions = _.flatMap(strapi.api, (api, apiName) => {
      return _.flatMap(api.controllers, (controller, controllerName) => {
        return _.keys(controller).map(actionName => {
          return `api::${apiName}.${controllerName}.${_.toLower(actionName)}`;
        });
      });
    });

    const pluginsActions = _.flatMap(strapi.plugins, (plugin, pluginName) => {
      return _.flatMap(plugin.controllers, (controller, controllerName) => {
        return _.keys(controller).map(actionName => {
          return `plugin::${pluginName}.${controllerName}.${_.toLower(actionName)}`;
        });
      });
    });

    const allActions = [...appActions, ...pluginsActions];

    const toDelete = _.difference(permissionsFoundInDB, allActions);

    await Promise.all(
      toDelete.map(action => {
        return strapi.query('plugin::users-permissions.permission').delete({ where: { action } });
      })
    );

    if (permissionsFoundInDB.length === 0) {
      // create default permissions
      for (const role of roles) {
        const toCreate = pipe(
          filter(({ roleType }) => roleType === role.type || roleType === null),
          map(prop('action'))
        )(DEFAULT_PERMISSIONS);

        await Promise.all(
          toCreate.map(action => {
            return strapi.query('plugin::users-permissions.permission').create({
              data: {
                action,
                role: role.id,
              },
            });
          })
        );
      }
    }
  },

  async initialize() {
    const roleCount = await strapi.query('plugin::users-permissions.role').count();

    if (roleCount === 0) {
      await strapi.query('plugin::users-permissions.role').create({
        data: {
          name: 'Authenticated',
          description: 'Default role given to authenticated user.',
          type: 'authenticated',
        },
      });

      await strapi.query('plugin::users-permissions.role').create({
        data: {
          name: 'Public',
          description: 'Default role given to unauthenticated user.',
          type: 'public',
        },
      });
    }

    return getService('users-permissions').updatePermissions();
  },

  async updateRole(roleID, body) {
    const [role, authenticated] = await Promise.all([
      this.getRole(roleID, []),
      strapi.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } }),
    ]);

    await strapi.query('plugin::users-permissions.role').update({
      where: { id: roleID },
      data: _.pick(body, ['name', 'description']),
    });

    await Promise.all(
      Object.keys(body.permissions || {}).reduce((acc, type) => {
        Object.keys(body.permissions[type].controllers).forEach(controller => {
          Object.keys(body.permissions[type].controllers[controller]).forEach(action => {
            const bodyAction = body.permissions[type].controllers[controller][action];
            const currentAction = _.get(
              role.permissions,
              `${type}.controllers.${controller}.${action}`,
              {}
            );

            if (!_.isEqual(bodyAction, currentAction)) {
              acc.push(
                strapi.query('plugin::users-permissions.permission').update({
                  where: {
                    role: roleID,
                    type,
                    controller,
                    action: action.toLowerCase(),
                  },
                  data: bodyAction,
                })
              );
            }
          });
        });

        return acc;
      }, [])
    );

    // Add user to this role.
    const newUsers = _.differenceBy(body.users, role.users, 'id');
    await Promise.all(newUsers.map(user => this.updateUserRole(user, roleID)));

    const oldUsers = _.differenceBy(role.users, body.users, 'id');
    await Promise.all(oldUsers.map(user => this.updateUserRole(user, authenticated.id)));
  },

  async updateUserRole(user, role) {
    return strapi
      .query('plugin::users-permissions.user')
      .update({ where: { id: user.id }, data: { role } });
  },

  template(layout, data) {
    const compiledObject = _.template(layout);
    return compiledObject(data);
  },
});
