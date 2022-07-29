'use strict';

const permissions = require('../');

// TODO: test abilityBuilderFactory
// TODO: test generateAbility with options
describe('Permissions Engine', () => {
  const allowedCondition = 'isAuthor';
  const deniedCondition = 'isAdmin';
  const providers = {
    action: { get: jest.fn() },
    condition: {
      // TODO: mock these
      get() {
        return {
          async handler({ permission }) {
            if (permission.conditions.includes(deniedCondition)) return false;
            if (permission.conditions.includes(allowedCondition)) return true;
            return false;
          },
        };
      },
    },
  };

  const generateInvalidateActionHook = action => {
    return params => {
      if (params.permission.action === action) {
        return false;
      }
    };
  };

  const buildEngine = (engineProviders = providers, engineHooks = []) => {
    const engine = permissions.engine.new({ providers: engineProviders });
    engineHooks.forEach(({ name, fn }) => {
      engine.on(name, fn);
    });
    return engine;
  };

  const buildEngineWithAbility = async ({ permissions, engineProviders, engineHooks }) => {
    const engine = buildEngine(engineProviders, engineHooks);
    const ability = await engine.generateAbility(permissions);
    return { engine, ability };
  };

  beforeEach(() => {
    //
  });

  it('registers action (string)', async () => {
    const { ability } = await buildEngineWithAbility({
      permissions: [{ action: 'read' }],
    });
    expect(ability.can('read')).toBeTruthy();
    expect(ability.can('i_dont_exist')).toBeFalsy();
  });

  it('registers action with null subject', async () => {
    const { ability } = await buildEngineWithAbility({
      permissions: [{ action: 'read', subject: null }],
    });
    expect(ability.can('read')).toBeTruthy();
  });

  it('registers action with subject', async () => {
    const { ability } = await buildEngineWithAbility({
      permissions: [{ action: 'read', subject: 'article' }],
    });
    expect(ability.can('read', 'article')).toBeTruthy();
    expect(ability.can('read', 'user')).toBeFalsy();
  });

  // TODO: I noticed another test checking this. Looks like we just test === on subject, so primitives or
  // objects passed by reference will work but object values will not work
  // it('requires subject to be string ', async () => {
  //   const subject = { id: 123 };
  //   const { ability } = await buildEngineWithAbility({
  //     permissions: [{ action: 'read', subject }],
  //   });
  //   expect(ability.can('read', subject)).toBeFalsy();
  // });

  it('registers action with subject and properties', async () => {
    const { ability } = await buildEngineWithAbility({
      permissions: [{ action: 'read', subject: 'article', properties: { fields: ['title'] } }],
    });
    expect(ability.can('read')).toBeFalsy();
    expect(ability.can('read', 'user')).toBeFalsy();
    expect(ability.can('read', 'article')).toBeTruthy();
    expect(ability.can('read', 'article', 'title')).toBeTruthy();
    expect(ability.can('read', 'article', 'name')).toBeFalsy();
  });

  describe('conditions', () => {
    it('does not register action when conditions not met', async () => {
      const { ability } = await buildEngineWithAbility({
        permissions: [
          {
            action: 'read',
            subject: 'article',
            properties: { fields: ['title'] },
            conditions: [deniedCondition],
          },
        ],
      });

      expect(ability.can('read')).toBeFalsy();
      expect(ability.can('read', 'user')).toBeFalsy();
      expect(ability.can('read', 'article', 'name')).toBeFalsy();

      expect(ability.can('read', 'article')).toBeFalsy();
      expect(ability.can('read', 'article', 'title')).toBeFalsy();
    });

    it('register action when conditions are met', async () => {
      const { ability } = await buildEngineWithAbility({
        permissions: [
          {
            action: 'read',
            subject: 'article',
            properties: { fields: ['title'] },
            conditions: [allowedCondition],
          },
        ],
      });

      expect(ability.can('read')).toBeFalsy();
      expect(ability.can('read', 'user')).toBeFalsy();
      expect(ability.can('read', 'article', 'name')).toBeFalsy();

      expect(ability.can('read', 'article')).toBeTruthy();
      expect(ability.can('read', 'article', 'title')).toBeTruthy();
    });
  });

  // TODO: test all hooks are called at the right time and bail correctly
  // 'before-format::validate.permission': hooks.createAsyncBailHook(),
  // 'format.permission': hooks.createAsyncSeriesWaterfallHook(),
  // 'post-format::validate.permission': hooks.createAsyncBailHook(),
  // 'before-evaluate.permission': hooks.createAsyncSeriesHook(),
  // 'before-register.permission': hooks.createAsyncSeriesHook(),
  describe('hooks', () => {
    it('format.permission can modify permissions', async () => {
      const { ability } = await buildEngineWithAbility({
        permissions: [{ action: 'read', subject: 'article' }],
        engineHooks: [
          {
            name: 'format.permission',
            fn(permission) {
              return {
                ...permission,
                action: 'view',
              };
            },
          },
        ],
      });

      expect(ability.can('read')).toBeFalsy();
      expect(ability.can('read')).toBeFalsy();
      expect(ability.can('view', 'article')).toBeTruthy();
    });

    // TODO: rewrite with mocks
    it('validate hooks are called at the right time', async () => {
      const { ability } = await buildEngineWithAbility({
        permissions: [{ action: 'update' }, { action: 'delete' }, { action: 'view' }],
        engineHooks: [
          {
            name: 'format.permission',
            fn(permission) {
              if (permission.action === 'update') {
                return {
                  ...permission,
                  action: 'modify',
                };
              }
              if (permission.action === 'delete') {
                return {
                  ...permission,
                  action: 'remove',
                };
              }
              if (permission.action === 'view') {
                return {
                  ...permission,
                  action: 'read',
                };
              }
              return permission;
            },
          },
          {
            name: 'before-format::validate.permission',
            fn: generateInvalidateActionHook('modify'),
          },
          {
            name: 'before-format::validate.permission',
            fn: generateInvalidateActionHook('view'),
          },
          {
            name: 'post-format::validate.permission',
            fn: generateInvalidateActionHook('update'),
          },
        ],
      });

      expect(ability.can('update')).toBeFalsy();
      expect(ability.can('modify')).toBeTruthy();
      expect(ability.can('delete')).toBeFalsy();
      expect(ability.can('remove')).toBeTruthy();
      expect(ability.can('view')).toBeFalsy();
    });

    it('before-format::validate.permission can prevent action register', async () => {
      const { ability } = await buildEngineWithAbility({
        permissions: [{ action: 'read', subject: 'article' }],
        engineHooks: [
          { name: 'before-format::validate.permission', fn: generateInvalidateActionHook('read') },
        ],
      });
      expect(ability.can('read', 'article')).toBeFalsy();
      expect(ability.can('read', 'user')).toBeFalsy();
    });
  });

  it('post-format::validate.permission can prevent action register', async () => {
    const { ability } = await buildEngineWithAbility({
      permissions: [{ action: 'read', subject: 'article' }],
      engineHooks: [
        { name: 'post-format::validate.permission', fn: generateInvalidateActionHook('read') },
      ],
    });
    expect(ability.can('read', 'article')).toBeFalsy();
    expect(ability.can('read', 'user')).toBeFalsy();
  });

  // TODO: mocks
  it('before-evaluate and before-register are called in the right order', async () => {
    let called = '';
    const beforeEvaluateFn = jest.fn(() => {
      called = 'beforeEvaluate';
    });
    const beforeRegisterFn = jest.fn(() => {
      expect(called).toEqual('beforeEvaluate');
      called = 'beforeRegister';
    });
    await buildEngineWithAbility({
      permissions: [{ action: 'read', subject: 'article' }],
      engineHooks: [
        {
          name: 'before-evaluate.permission',
          fn: beforeEvaluateFn,
        },
        {
          name: 'before-register.permission',
          fn: beforeRegisterFn,
        },
      ],
    });

    expect(beforeEvaluateFn).toBeCalledTimes(1);
    expect(beforeEvaluateFn).toBeCalledTimes(1);
    expect(called).toEqual('beforeRegister');
  });
});
