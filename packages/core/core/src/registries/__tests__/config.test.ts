import configProvider from '../config';

const logLevel = 'warn';

describe('config', () => {
  test('returns objects for partial paths', () => {
    const config = configProvider({ default: { child: 'val' } });
    expect(config.get('default')).toEqual({ child: 'val' });
  });
  test('supports full paths', () => {
    const config = configProvider({ default: { child: 'val' } });
    expect(config.get('default.child')).toEqual('val');
  });
  test('accepts initial values', () => {
    const config = configProvider({ default: 'val', foo: 'bar' });
    expect(config.get('default')).toEqual('val');
    expect(config.get('foo')).toEqual('bar');
  });
  test('accepts uid in paths', () => {
    const config = configProvider({
      'api::myapi': { foo: 'val' },
      'plugin::myplugin': { foo: 'bar' },
    });

    expect(config.get('api::myapi.foo')).toEqual('val');
    expect(config.get('api::myapi')).toEqual({ foo: 'val' });
    expect(config.get('plugin::myplugin.foo')).toEqual('bar');
    expect(config.get('plugin::myplugin')).toEqual({ foo: 'bar' });
  });
  test('get supports deprecation for plugin.', () => {
    const consoleSpy = jest.spyOn(console, logLevel).mockImplementation(() => {});

    const config = configProvider({
      'plugin::myplugin': { foo: 'bar' },
    });

    expect(config.get('plugin.myplugin.foo')).toEqual('bar');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('deprecated'));
    consoleSpy.mockRestore();
  });
  test('set supports deprecation for plugin.', () => {
    const consoleSpy = jest.spyOn(console, logLevel).mockImplementation(() => {});

    const config = configProvider({
      'plugin::myplugin': { foo: 'bar' },
    });
    config.set('plugin.myplugin.thing', 'val');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('deprecated'));

    expect(config.get('plugin::myplugin.thing')).toEqual('val');
    consoleSpy.mockRestore();
  });
  test('logs deprecation with strapi logger if available', () => {
    const consoleSpy = jest.spyOn(console, logLevel).mockImplementation(() => {});

    const logSpy = jest.fn();
    const config = configProvider(
      {
        'plugin::myplugin': { foo: 'bar' },
      },
      { log: { [logLevel]: logSpy } } as any
    );

    expect(config.get('plugin.myplugin.foo')).toEqual('bar');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('deprecated'));
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
  test('get does NOT support deprecation for other prefixes', () => {
    const config = configProvider({
      'api::myapi': { foo: 'bar' },
    });

    expect(config.get('api.myapi')).toEqual(undefined);
  });

  test('set does NOT support deprecation for other prefixes', () => {
    const config = configProvider({
      'api::myapi': { foo: 'bar' },
    });

    config.set('api.myapi.foo', 'nope');
    expect(config.get('api.myapi.foo')).toEqual('nope');
    expect(config.get('api::myapi.foo')).toEqual('bar');
  });
});
