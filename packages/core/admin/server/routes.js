'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/plugins',
    handler: 'admin.plugins',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::marketplace.read'] } },
      ],
    },
  },
  {
    method: 'GET',
    path: '/init',
    handler: 'admin.init',
  },
  {
    method: 'GET',
    path: '/project-type',
    handler: 'admin.getProjectType',
  },
  {
    method: 'GET',
    path: '/information',
    handler: 'admin.information',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/plugins/install',
    handler: 'admin.installPlugin',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          options: { actions: ['admin::marketplace.plugins.install'] },
        },
      ],
    },
  },
  {
    method: 'DELETE',
    path: '/plugins/uninstall/:plugin',
    handler: 'admin.uninstallPlugin',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        {
          name: 'admin::hasPermissions',
          options: { actions: ['admin::marketplace.plugins.uninstall'] },
        },
      ],
    },
  },
  {
    method: 'POST',
    path: '/login',
    handler: 'authentication.login',
  },
  {
    method: 'POST',
    path: '/renew-token',
    handler: 'authentication.renewToken',
  },
  {
    method: 'POST',
    path: '/register-admin',
    handler: 'authentication.registerAdmin',
  },
  {
    method: 'GET',
    path: '/registration-info',
    handler: 'authentication.registrationInfo',
  },
  {
    method: 'POST',
    path: '/register',
    handler: 'authentication.register',
  },
  {
    method: 'POST',
    path: '/forgot-password',
    handler: 'authentication.forgotPassword',
  },
  {
    method: 'POST',
    path: '/reset-password',
    handler: 'authentication.resetPassword',
  },
  {
    method: 'GET',
    path: '/webhooks',
    handler: 'Webhooks.listWebhooks',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::webhooks.read'] } },
      ],
    },
  },
  {
    method: 'POST',
    path: '/webhooks',
    handler: 'Webhooks.createWebhook',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::webhooks.create'] } },
      ],
    },
  },
  {
    method: 'GET',
    path: '/webhooks/:id',
    handler: 'Webhooks.getWebhook',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::webhooks.read'] } },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/webhooks/:id',
    handler: 'Webhooks.updateWebhook',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::webhooks.update'] } },
      ],
    },
  },
  {
    method: 'DELETE',
    path: '/webhooks/:id',
    handler: 'Webhooks.deleteWebhook',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::webhooks.delete'] } },
      ],
    },
  },
  {
    method: 'POST',
    path: '/webhooks/batch-delete',
    handler: 'Webhooks.deleteWebhooks',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::webhooks.delete'] } },
      ],
    },
  },
  {
    method: 'POST',
    path: '/webhooks/:id/trigger',
    handler: 'Webhooks.triggerWebhook',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/users/me',
    handler: 'authenticated-user.getMe',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'PUT',
    path: '/users/me',
    handler: 'authenticated-user.updateMe',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/users/me/permissions',
    handler: 'authenticated-user.getOwnPermissions',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/users',
    handler: 'user.create',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::users.create'] } },
      ],
    },
  },
  {
    method: 'GET',
    path: '/users',
    handler: 'user.find',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::users.read'] } },
      ],
    },
  },
  {
    method: 'GET',
    path: '/users/:id',
    handler: 'user.findOne',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::users.read'] } },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/users/:id',
    handler: 'user.update',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::users.update'] } },
      ],
    },
  },
  {
    method: 'DELETE',
    path: '/users/:id',
    handler: 'user.deleteOne',
    config: {
      policies: [{ name: 'admin::hasPermissions', options: { actions: ['admin::users.delete'] } }],
    },
  },
  {
    method: 'POST',
    path: '/users/batch-delete',
    handler: 'user.deleteMany',
    config: {
      policies: [{ name: 'admin::hasPermissions', options: { actions: ['admin::users.delete'] } }],
    },
  },
  {
    method: 'GET',
    path: '/roles/:id/permissions',
    handler: 'role.getPermissions',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::roles.read'] } },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/roles/:id/permissions',
    handler: 'role.updatePermissions',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::roles.update'] } },
      ],
    },
  },
  {
    method: 'GET',
    path: '/roles/:id',
    handler: 'role.findOne',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::roles.read'] } },
      ],
    },
  },
  {
    method: 'GET',
    path: '/roles',
    handler: 'role.findAll',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::roles.read'] } },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/roles/:id',
    handler: 'role.update',
    config: {
      policies: [
        'admin::isAuthenticatedAdmin',
        { name: 'admin::hasPermissions', options: { actions: ['admin::roles.update'] } },
      ],
    },
  },
  {
    method: 'GET',
    path: '/permissions',
    handler: 'permission.getAll',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'POST',
    path: '/permissions/check',
    handler: 'permission.check',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
];
