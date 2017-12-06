'use strict';

const fs = require('fs')
const path = require('path');
const stringify = JSON.stringify;
const _ = require('lodash');
// const Service = strapi.plugins['users-permissions'].services;
/**
 * UsersPermissions.js service
 *
 * @description: A set of functions similar to controller's actions to avoid code duplication.
 */

module.exports = {
  createRole: (role) => {
    const Service = strapi.plugins['users-permissions'].services.userspermissions;
    const appRoles = require(Service.getRoleConfigPath());
    const highestId = _.last(Object.keys(appRoles).reduce((acc, key) => {
      acc.push(_.toNumber(key));

      return acc;
    }, []).sort()) + 1;

    const newRole = _.pick(role, ['name', 'description', 'permissions']);

    _.set(appRoles, highestId.toString(), newRole);

    _.forEach(role.users, (user) => {
      Service.updateUserRole(user, highestId);
    });

    Service.writePermissions(appRoles);
  },

  deleteRole: async (roleId) => {
    const Service = strapi.plugins['users-permissions'].services.userspermissions;
    const appRoles = require(Service.getRoleConfigPath());

    Service.writePermissions(_.omit(appRoles, [roleId]));

    const users = await strapi.query('user', 'users-permissions').find(strapi.utils.models.convertParams('user', {
      role: roleId
    }));

    _.forEach(users, (user) => {
      Service.updateUserRole(user, '1');
    });
  },

  getActions: () => {
    const generateActions = (data) => (
      Object.keys(data).reduce((acc, key) => {
        acc[key] = { enabled: false, policy: '' };

        return acc;
    }, {}));

    const appControllers = Object.keys(strapi.api || {}).reduce((acc, key) => {
      acc.controllers[key] = generateActions(strapi.api[key].controllers[key]);

      return acc;
    }, { controllers: {} });

    const pluginsPermissions = Object.keys(strapi.plugins).reduce((acc, key) => {
      acc[key] = Object.keys(strapi.plugins[key].controllers).reduce((obj, k) => {
        obj.controllers[k] = generateActions(strapi.plugins[key].controllers[k]);

        return obj;

      }, { controllers: {} });

      return acc;
    }, {});

    const permissions = {
      application: {
        controllers: appControllers.controllers,
      },
    };

    const allPermissions = _.merge(permissions, pluginsPermissions);

    return allPermissions;
  },

  getRole: async (roleId) => {
    const Service = strapi.plugins['users-permissions'].services.userspermissions;
    const appRoles = require(Service.getRoleConfigPath());
    appRoles[roleId].users = await strapi.query('user', 'users-permissions').find(strapi.utils.models.convertParams('user', { role: roleId }));

    return appRoles[roleId];
  },

  getRoles: async () => {
    const Service = strapi.plugins['users-permissions'].services.userspermissions;
    const roles = require(Service.getRoleConfigPath());
    const usersCount = await strapi.query('user', 'users-permissions').countByRoles();
    const formattedRoles = Object.keys(roles).reduce((acc, key) => {
      const role = _.pick(roles[key], ['name', 'description']);

      _.set(role, 'id', key);
      _.set(role, 'nb_users', _.get(_.find(usersCount, { _id: parseFloat(key) }), 'total', 0));
      acc.push(role);

      return acc;
    }, []);

    return formattedRoles;
  },

  getRoutes: async () => {
    return Object.keys(strapi.plugins).reduce((acc, current) => {
      acc[current] = strapi.plugins[current].config.routes;

      return acc;
    }, {});
  },

  getRoleConfigPath: () => (
    path.join(
      strapi.config.appPath,
      'plugins',
      'users-permissions',
      'config',
      'roles.json',
    )
  ),

  updateData: (data, diff = 'unset') => {
    const dataToCompare = strapi.plugins['users-permissions'].services.userspermissions.getActions();

    _.forEach(data, (roleData, roleId) => {
      const obj = diff === 'unset' ? roleData.permissions : dataToCompare;

      _.forEach(obj, (pluginData, pluginName) => {
        _.forEach(pluginData.controllers, (controllerActions, controllerName) => {
          _.forEach(controllerActions, (actionData, actionName) => {
            if (diff === 'unset') {
              if (!_.get(dataToCompare, [pluginName, 'controllers', controllerName])) {
                _.unset(data, [roleId, 'permissions',  pluginName, 'controllers', controllerName]);
                return;
              }

              if (!_.get(dataToCompare, [pluginName, 'controllers', controllerName, actionName])) {
                _.unset(data, [roleId, 'permissions', pluginName, 'controllers', controllerName, actionName]);
              }
            } else {
              if (!_.get(data, [roleId, 'permissions', pluginName, 'controllers', controllerName, actionName])) {
                const isCallback = actionName === 'callback' && controllerName === 'auth' && pluginName === 'users-permissions' && roleId === '1';
                const isRegister = actionName === 'register' && controllerName === 'auth' && pluginName === 'users-permissions' && roleId === '1';
                const isPassword = actionName === 'forgotPassword' && controllerName === 'auth' && pluginName === 'users-permissions' && roleId === '1';
                const isNewPassword = actionName === 'changePassword-password' && controllerName === 'auth' && pluginName === 'users-permissions' && roleId === '1';
                const isInit = actionName === 'init' && controllerName === 'userspermissions';
                const enabled = isCallback || isRegister || roleId === '0' || isInit || isPassword || isNewPassword;

                _.set(data, [roleId, 'permissions', pluginName, 'controllers', controllerName, actionName], { enabled, policy: '' })
              }
            }
          });
        });
      });
    });

    return data;
  },

  updatePermissions: async (cb) => {
    const Service = strapi.plugins['users-permissions'].services.userspermissions;
    const appActions = Service.getActions();
    const roleConfigPath = Service.getRoleConfigPath();
    const writePermissions = Service.writePermissions;
    const currentRoles = require(roleConfigPath);
    const remove = await Service.updateData(_.cloneDeep(currentRoles));
    const added = await Service.updateData(_.cloneDeep(remove), 'set');

    if (!_.isEqual(currentRoles, added)) {
      writePermissions(added);
    }

    if (cb) {
      cb();
    }
  },

  updateRole: async (roleId, body) => {
    const Service = strapi.plugins['users-permissions'].services.userspermissions;
    const appRoles = require(Service.getRoleConfigPath());
    const updatedRole = _.pick(body, ['name', 'description', 'permissions']);
    _.set(appRoles, [roleId], updatedRole);

    Service.writePermissions(appRoles);

    const currentUsers = await strapi.query('user', 'users-permissions').find(strapi.utils.models.convertParams('user', {
      role: roleId
    }));

    const userToAdd = _.differenceBy(body.users, currentUsers, 'id');
    const userToRemove = _.differenceBy(currentUsers, body.users, 'id');

    _.forEach(userToAdd, (user) => {
      Service.updateUserRole(user, roleId);
    });
    _.forEach(userToRemove, (user) => {
      Service.updateUserRole(user, '1');
    });
  },

  writePermissions: (data) => {
    const roleConfigPath = strapi.plugins['users-permissions'].services.userspermissions.getRoleConfigPath();

    try {
      fs.writeFileSync(roleConfigPath, stringify(data, null, 2), 'utf8');
    } catch(err) {
      strapi.log.error(err);
    }
  },

  updateUserRole: async (user, role) => {
    await strapi.query('user', 'users-permissions').update({
      _id: user._id || user.id,
      role: role.toString()
    });
  }
};
