import type { Schema, Documents } from '@strapi/types';
import { curry, assoc } from 'lodash/fp';

type Transform = (
  contentType: Schema.SingleType | Schema.CollectionType,
  params: Documents.Params.All
) => Documents.Params.All;

type AsyncTransform = (
  contentType: Schema.SingleType | Schema.CollectionType,
  params: Documents.Params.All
) => Promise<Documents.Params.All>;

const getDefaultLocale = async (): Promise<string> => {
  return strapi.plugin('i18n').service('locales').getDefaultLocale();
};

const defaultLocale: AsyncTransform = async (contentType, params) => {
  if (!strapi.plugin('i18n').service('content-types').isLocalizedContentType(contentType)) {
    return params;
  }

  if (!params.locale) {
    // TODO: Load default locale from db in i18n
    return assoc('locale', await getDefaultLocale(), params);
  }

  return params;
};

/**
 * Add locale lookup query to the params
 */
const localeToLookup: Transform = (contentType, params) => {
  if (!strapi.plugin('i18n').service('content-types').isLocalizedContentType(contentType)) {
    return params;
  }

  if (params.locale) {
    return assoc(['lookup', 'locale'], params.locale, params);
  }

  return params;
};

/**
 * Add locale lookup query to the params
 */
const multiLocaleToLookup: Transform = (contentType, params) => {
  if (!strapi.plugin('i18n').service('content-types').isLocalizedContentType(contentType)) {
    return params;
  }

  if (params.locale) {
    if (params.locale === '*') {
      return params;
    }

    return assoc(['lookup', 'locale'], params.locale, params);
  }

  return params;
};

/**
 * Translate locale status parameter into the data that will be saved
 */
const localeToData: Transform = (contentType, params) => {
  if (!strapi.plugin('i18n').service('content-types').isLocalizedContentType(contentType)) {
    return params;
  }

  if (params.locale) {
    return assoc(['data', 'locale'], params.locale, params);
  }

  return params;
};

const defaultLocaleCurry = curry(defaultLocale);
const localeToLookupCurry = curry(localeToLookup);
const multiLocaleToLookupCurry = curry(multiLocaleToLookup);
const localeToDataCurry = curry(localeToData);

export {
  defaultLocaleCurry as defaultLocale,
  localeToLookupCurry as localeToLookup,
  localeToDataCurry as localeToData,
  multiLocaleToLookupCurry as multiLocaleToLookup,
};
