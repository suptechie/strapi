'use strict';

const errors = require('@strapi/utils');
const auth = require('../../auth');

const mockStrapi = {
  contentAPI: {
    sanitize: {
      output: jest.fn((input) => input),
    },
  },
  store: jest.fn(() => {
    return {
      get: jest.fn(() => {
        return { allow_register: true };
      }),
    };
  }),
  config: {
    get: jest.fn(() => {
      return {
        register: {
          // only set allowedFields on a per-test basis
        },
      };
    }),
  },
  db: {
    query: jest.fn(() => {
      return {
        findOne: jest.fn(() => {
          return {
            role: 1,
          };
        }),
        count: jest.fn(() => {
          return 0;
        }),
      };
    }),
  },
  plugins: {
    'users-permissions': {
      controllers: {},
      contentTypes: {},
      policies: {},
      services: {},
    },
  },
  getModel: jest.fn(),
};

jest.mock('@strapi/utils', () => {
  return {
    ...jest.requireActual('@strapi/utils'),
    sanitizeUser: jest.fn((input) => input),
    sanitize: {
      contentAPI: {
        output: jest.fn((input) => input),
      },
    },
  };
});

jest.mock('../../../utils', () => {
  return {
    getService: jest.fn(() => {
      return {
        add: jest.fn((user) => {
          return user;
        }),
        issue: jest.fn(),
      };
    }),
  };
});

describe('user-permissions auth', () => {
  beforeAll(() => {
    global.strapi = mockStrapi;
  });

  describe('register', () => {
    test('accepts valid registration', async () => {
      const ctx = {
        state: {
          auth: {},
        },
        request: {
          body: { username: 'testuser', email: 'test@example.com', password: 'Testpassword1!' },
        },
        send: jest.fn(),
      };
      const authorization = auth({ strapi: global.strapi });
      await authorization.register(ctx);
      expect(ctx.send).toHaveBeenCalledTimes(1);
    });

    test('throws ValidationError when passed extra fields when allowedField is undefined', async () => {
      global.strapi = {
        ...mockStrapi,
        config: {
          get: jest.fn(() => {
            return {
              register: {
                // empty
              },
            };
          }),
        },
      };

      const ctx = {
        state: {
          auth: {},
        },
        request: {
          body: {
            confirmed: true,
            username: 'testuser',
            email: 'test@example.com',
            password: 'Testpassword1!',
          },
        },
        send: jest.fn(),
      };
      const authorization = auth({ strapi: global.strapi });
      await expect(authorization.register(ctx)).rejects.toThrow(errors.ValidationError);
      expect(ctx.send).toHaveBeenCalledTimes(0);
    });

    test('throws ValidationError when passed extra fields when allowedField is []', async () => {
      global.strapi = {
        ...mockStrapi,
        config: {
          get: jest.fn(() => {
            return {
              register: {
                allowedFields: [],
              },
            };
          }),
        },
      };

      const ctx = {
        state: {
          auth: {},
        },
        request: {
          body: {
            confirmed: true,
            username: 'testuser',
            email: 'test@example.com',
            password: 'Testpassword1!',
          },
        },
        send: jest.fn(),
      };
      const authorization = auth({ strapi: global.strapi });
      await expect(authorization.register(ctx)).rejects.toThrow(errors.ValidationError);
      expect(ctx.send).toHaveBeenCalledTimes(0);
    });

    test('allows exceptions from config register.allowedFields', async () => {
      global.strapi = {
        ...mockStrapi,
        config: {
          get: jest.fn(() => {
            return {
              register: {
                allowedFields: ['confirmed'],
              },
            };
          }),
        },
      };

      const ctx = {
        state: {
          auth: {},
        },
        request: {
          body: {
            confirmed: true,
            username: 'testuser',
            email: 'test@example.com',
            password: 'Testpassword1!',
          },
        },
        send: jest.fn(),
      };
      const authorization = auth({ strapi: global.strapi });
      await authorization.register(ctx);
      expect(ctx.send).toHaveBeenCalledTimes(1);
    });

    test('password does not follow custom validation pattern', async () => {
      global.strapi = {
        ...mockStrapi,
        config: {
          get: jest.fn((path) => {
            if (path === 'plugin::users-permissions.validationRules') {
              return {
                validatePassword(value) {
                  // Custom validation logic: at least 1 uppercase, 1 lowercase, and 1 number
                  const hasUpperCase = /[A-Z]/.test(value);
                  const hasLowerCase = /[a-z]/.test(value);
                  const hasNumber = /[0-9]/.test(value);
                  return hasUpperCase && hasLowerCase && hasNumber && value.length >= 6;
                },
              };
            }
            return {
              register: {
                allowedFields: [],
              },
            };
          }),
        },
      };

      const ctx = {
        state: {
          auth: {},
        },
        request: {
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'TestingPassword',
          },
        },
        send: jest.fn(),
      };
      const authorization = auth({ strapi: global.strapi });
      await expect(authorization.register(ctx)).rejects.toThrow(errors.ValidationError);
      expect(ctx.send).toHaveBeenCalledTimes(0);
    });

    test('password follows custom validation pattern', async () => {
      global.strapi = {
        ...mockStrapi,
        config: {
          get: jest.fn((path) => {
            if (path === 'plugin::users-permissions.validationRules') {
              return {
                validatePassword(value) {
                  // Custom validation logic: at least 1 uppercase, 1 lowercase, and 1 number
                  const hasUpperCase = /[A-Z]/.test(value);
                  const hasLowerCase = /[a-z]/.test(value);
                  const hasNumber = /[0-9]/.test(value);
                  return hasUpperCase && hasLowerCase && hasNumber && value.length >= 6;
                },
              };
            }
            return {
              register: {
                allowedFields: [],
              },
            };
          }),
        },
      };

      const ctx = {
        state: {
          auth: {},
        },
        request: {
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123',
          },
        },
        send: jest.fn(),
      };
      const authorization = auth({ strapi: global.strapi });
      await authorization.register(ctx);
      expect(ctx.send).toHaveBeenCalledTimes(1);
    });
  });
});
