'use strict';

const customFieldRegistry = require('../custom-fields');

const strapi = {
  plugins: { plugintest: 'foo' },
  plugin: jest.fn(plugin => strapi.plugins[plugin]),
};

describe('custom fields', () => {
  it('adds a custom field registered in a plugin', () => {
    const mockCF = {
      name: 'test',
      plugin: 'plugintest',
      type: 'text',
    };

    const customFields = customFieldRegistry(strapi);
    customFields.add(mockCF);

    const expected = {
      'plugin::plugintest.test': mockCF,
    };
    expect(customFields.getAll()).toEqual(expected);
  });

  it('adds a custom field not registered in a plugin', () => {
    const mockCF = {
      name: 'test',
      type: 'text',
    };

    const customFields = customFieldRegistry(strapi);
    customFields.add(mockCF);

    const expected = {
      'global::global.test': mockCF,
    };
    expect(customFields.getAll()).toEqual(expected);
  });

  it('requires a name key on the custom field', () => {
    const mockCF = {
      type: 'test',
    };

    const customFields = customFieldRegistry(strapi);

    expect(() => customFields.add(mockCF)).toThrowError(
      `Custom fields require a 'name' and 'type' key`
    );
  });

  it('requires a type key on the custom field', () => {
    const mockCF = {
      name: 'test',
    };

    const customFields = customFieldRegistry(strapi);

    expect(() => customFields.add(mockCF)).toThrowError(
      `Custom fields require a 'name' and 'type' key`
    );
  });

  it('validates the name can be used as an object key', () => {
    const mockCF = {
      name: 'test.boom',
      type: 'text',
    };

    const customFields = customFieldRegistry(strapi);

    expect(() => customFields.add(mockCF)).toThrowError(
      `Custom field name: 'test.boom' is not a valid object key`
    );
  });

  it('validates the type is a Strapi type', () => {
    const mockCF = {
      name: 'test',
      type: 'geojson',
    };

    const customFields = customFieldRegistry(strapi);

    expect(() => customFields.add(mockCF)).toThrowError(
      `Custom field type: 'geojson' is not a valid Strapi type`
    );
  });

  it('confirms the custom field does not already exist', () => {
    const mockCF = {
      name: 'test',
      plugin: 'plugintest',
      type: 'text',
    };

    const customFields = customFieldRegistry(strapi);

    customFields.add(mockCF);
    expect(() => customFields.add(mockCF)).toThrowError(
      `Custom field: 'plugin::plugintest.test' has already been registered`
    );
  });
});
