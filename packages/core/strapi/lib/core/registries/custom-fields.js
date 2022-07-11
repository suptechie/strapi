'use strict';

const { has } = require('lodash/fp');
const validators = require('../../services/entity-validator/validators');

const customFieldsRegistry = strapi => {
  const customFields = {};

  return {
    getAll() {
      return customFields;
    },
    add(customField) {
      const customFieldList = Array.isArray(customField) ? customField : [customField];

      for (const cf of customFieldList) {
        const { name, plugin, type } = cf;
        if (!name || !type) {
          throw new Error(`Custom fields require a 'name' and 'type' key`);
        }

        if (!has(type, validators)) {
          throw new Error(`Custom field type: '${type}' is not a valid Strapi type`);
        }

        const isValidObjectKey = /^(?![0-9])[a-zA-Z0-9$_-]+$/g;
        if (!isValidObjectKey.test(name)) {
          throw new Error(`Custom field name: '${name}' is not a valid object key`);
        }

        // When no plugin is specified, or it isn't found in Strapi, default to global
        const namespace = strapi.plugin(plugin)
          ? `plugin::${plugin}.${name}`
          : `global::global.${name}`;

        if (has(namespace, customFields)) {
          throw new Error(`Custom field: '${namespace}' has already been registered`);
        }

        customFields[namespace] = cf;
      }
    },
  };
};

module.exports = customFieldsRegistry;
