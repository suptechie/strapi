'use strict';

const { reduce } = require('lodash/fp');
const { getService } = require('../utils');

const sendDidInitializeEvent = async () => {
  const { isLocalizedContentType } = getService('content-types');

  const numberOfContentTypes = reduce(
    (sum, contentType) => (isLocalizedContentType(contentType) ? sum + 1 : sum),
    0
  )(strapi.contentTypes);

  // This event is anonymous
  await strapi.telemetry.send('didInitializeI18n', { groupProperties: { numberOfContentTypes } });
};

const sendDidUpdateI18nLocalesEvent = async (adminUser) => {
  const numberOfLocales = await getService('locales').count();

  await strapi.telemetry.send('didUpdateI18nLocales', {
    adminUser,
    groupProperties: { numberOfLocales },
  });
};

module.exports = () => ({
  sendDidInitializeEvent,
  sendDidUpdateI18nLocalesEvent,
});
