import formatSettingsPermissionsToAPI, {
  createConditionsArray,
  createPermission,
  createPermissionsArrayFromCategory,
} from '../formatSettingsPermissionsToAPI';

describe('ADMIN | COMPONENTS | Roles | Permissions | utils', () => {
  describe('createConditionsArray', () => {
    it('should return an empty array when all conditions are falsy', () => {
      const conditions = {
        test: false,
        ok: false,
      };

      expect(createConditionsArray(conditions)).toEqual([]);
    });

    it('should return an array of condition names when the conditions are truthy', () => {
      const conditions = {
        foo: true,
        bar: false,
        batz: true,
      };
      const expected = ['foo', 'batz'];

      expect(createConditionsArray(conditions)).toEqual(expected);
    });
  });

  describe('createPermission', () => {
    it('should return a permission object', () => {
      const permission = ['read', { enabled: true, conditions: { foo: false, bar: true } }];
      const expected = { action: 'read', subject: null, conditions: ['bar'] };

      expect(createPermission(permission)).toEqual(expected);
    });
  });

  describe('createPermissionsArrayFromCategory', () => {
    it('should return an array of permissions containing only the enabled permissions', () => {
      const permissions = {
        settings: {
          'plugins::documentation.settings.update': {
            enabled: false,
            conditions: {
              'admin::is-creator': false,
              'admin::has-same-role-as-creator': false,
            },
          },
          'plugins::documentation.settings.regenerate': {
            enabled: true,
            conditions: {
              'admin::is-creator': false,
              'admin::has-same-role-as-creator': false,
            },
          },
        },
      };

      const expected = [
        { action: 'plugins::documentation.settings.regenerate', subject: null, conditions: [] },
      ];

      expect(createPermissionsArrayFromCategory(permissions)).toEqual(expected);
    });
  });

  describe('formatSettingsPermissionsToAPI', () => {
    it('should return an array', () => {
      expect(formatSettingsPermissionsToAPI({})).toEqual([]);
    });

    it('should return an array empty array when no permissions is enabled', () => {
      const settingsPermissions = {
        'plugin::content-type-builder': {
          general: {
            'plugins::content-type-builder.read': {
              enabled: false,
              conditions: {
                'admin::is-creator': false,
                'admin::has-same-role-as-creator': false,
              },
            },
          },
        },
        'plugin::documentation': {
          general: {
            'plugins::documentation.read': {
              enabled: false,
              conditions: {
                'admin::is-creator': false,
                'admin::has-same-role-as-creator': false,
              },
            },
          },
          settings: {
            'plugins::documentation.settings.update': {
              enabled: false,
              conditions: {
                'admin::is-creator': false,
                'admin::has-same-role-as-creator': false,
              },
            },
            'plugins::documentation.settings.regenerate': {
              enabled: false,
              conditions: {
                'admin::is-creator': false,
                'admin::has-same-role-as-creator': false,
              },
            },
          },
        },
      };

      expect(formatSettingsPermissionsToAPI(settingsPermissions)).toEqual([]);
    });

    it('should return an array empty array of permissions when the permissions are enabled', () => {
      const settingsPermissions = {
        'plugin::content-type-builder': {
          general: {
            'plugins::content-type-builder.read': {
              enabled: false,
              conditions: {
                'admin::is-creator': false,
                'admin::has-same-role-as-creator': false,
              },
            },
          },
        },
        'plugin::documentation': {
          general: {
            'plugins::documentation.read': {
              enabled: true,
              conditions: {
                'admin::is-creator': true,
                'admin::has-same-role-as-creator': false,
              },
            },
          },
          settings: {
            'plugins::documentation.settings.update': {
              enabled: true,
              conditions: {
                'admin::is-creator': true,
                'admin::has-same-role-as-creator': true,
              },
            },
            'plugins::documentation.settings.regenerate': {
              enabled: true,
              conditions: {
                'admin::is-creator': false,
                'admin::has-same-role-as-creator': false,
              },
            },
          },
        },
      };

      const expected = [
        {
          action: 'plugins::documentation.read',
          conditions: ['admin::is-creator'],
          subject: null,
        },
        {
          action: 'plugins::documentation.settings.update',
          conditions: ['admin::is-creator', 'admin::has-same-role-as-creator'],
          subject: null,
        },
        {
          action: 'plugins::documentation.settings.regenerate',
          conditions: [],
          subject: null,
        },
      ];

      expect(formatSettingsPermissionsToAPI(settingsPermissions)).toEqual(expected);
    });
  });
});
