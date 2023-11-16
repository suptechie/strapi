import { fixtures } from '@strapi/admin-test-utils';

/**
 * This is for the redux store in `utils`.
 * The more we adopt it, the bigger it will get – which is okay.
 */
const initialState = {
  i18n_locales: {
    isLoading: true,
    locales: [],
  },
  admin_app: { permissions: fixtures.permissions.app },
  rbacProvider: {
    allPermissions: [
      ...fixtures.permissions.allPermissions,
      {
        id: 314,
        action: 'admin::users.read',
        subject: null,
        properties: {},
        conditions: [],
      },
    ],
  },
};

export { initialState };
