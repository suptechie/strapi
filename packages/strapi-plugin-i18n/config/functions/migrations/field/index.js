'use strict';

const { difference, keys, intersection, isEmpty } = require('lodash/fp');
const { getService } = require('../../../../utils');
const migrateForMongoose = require('./migrate-for-mongoose');
const migrateForBookshelf = require('./migrate-for-bookshelf');

// Migration when i18n is disabled on a field of a content-type that have i18n enabled
const after = async ({ model, definition, previousDefinition, ORM }) => {
  const { isLocalizedContentType, getLocalizedAttributes } = getService('content-types');

  if (!isLocalizedContentType(model) || !isLocalizedContentType(previousDefinition)) {
    return;
  }

  const localizedAttributes = getLocalizedAttributes(definition);
  const prevLocalizedAttributes = getLocalizedAttributes(previousDefinition);
  const attributesDisabled = difference(prevLocalizedAttributes, localizedAttributes);
  const attributesToMigrate = intersection(keys(definition.attributes), attributesDisabled);

  if (isEmpty(attributesToMigrate)) {
    return;
  }

  if (model.orm === 'bookshelf') {
    await migrateForBookshelf({ ORM, model, attributesToMigrate });
  } else if (model.orm === 'mongoose') {
    await migrateForMongoose({ model, attributesToMigrate });
  }
};

const before = () => {};

module.exports = {
  before,
  after,
};
