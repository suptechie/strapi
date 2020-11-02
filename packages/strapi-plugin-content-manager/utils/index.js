'use strict';

const { prop } = require('lodash/fp');
const parseBody = require('./parse-body');
const wrapBadRequest = require('./wrap-bad-request');
const setCreatorFields = require('./set-creator-fields');
const pickWritableAttributes = require('./pick-writable-attributes');

// retrieve a local service
const getService = name => {
  return prop(`content-manager.services.${name}`, strapi.plugins);
};

module.exports = {
  getService,
  parseBody,
  wrapBadRequest,
  setCreatorFields,
  pickWritableAttributes,
};
