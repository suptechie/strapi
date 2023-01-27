'use strict';

module.exports = {
  sso: [
    {
      method: 'GET',
      path: '/providers',
      handler: 'authentication.getProviders',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/connect/:provider',
      handler: 'authentication.providerLogin',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/connect/:provider',
      handler: 'authentication.providerLogin',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/providers/options',
      handler: 'authentication.getProviderLoginOptions',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { name: 'admin::hasPermissions', config: { actions: ['admin::provider-login.read'] } },
        ],
      },
    },
    {
      method: 'PUT',
      path: '/providers/options',
      handler: 'authentication.updateProviderLoginOptions',
      config: {
        policies: [
          'admin::isAuthenticatedAdmin',
          { name: 'admin::hasPermissions', config: { actions: ['admin::provider-login.update'] } },
        ],
      },
    },
  ],
  'review-workflows': [
    {
      method: 'GET',
      path: '/review-workflows/workflows',
      handler: 'workflows.find',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'GET',
      path: '/review-workflows/workflows/:id',
      handler: 'workflows.findOne',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
  ],
};
