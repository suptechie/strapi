import type { Struct } from '@strapi/types';

export const defaultLocale = (
  contentType: Struct.SingleTypeSchema | Struct.CollectionTypeSchema,
  params: any
) => {
  if (!strapi.plugin('i18n').service('content-types').isLocalizedContentType(contentType)) {
    return;
  }

  if (!params.locale) {
    // Default to en (TODO: Load default locale from db in i18n)
    params.locale = 'en';
  }
};

/**
 * Add locale lookup query to the params
 */
export const localeToLookup = (
  contentType: Struct.SingleTypeSchema | Struct.CollectionTypeSchema,
  params: any
) => {
  if (!strapi.plugin('i18n').service('content-types').isLocalizedContentType(contentType)) {
    return;
  }

  const lookup = params.lookup || {};

  if (params.locale) {
    lookup.locale = params.locale;
    params.lookup = lookup;
  }
};

/**
 * Translate locale status parameter into the data that will be saved
 */
export const localeToData = (
  contentType: Struct.SingleTypeSchema | Struct.CollectionTypeSchema,
  params: any
) => {
  if (!strapi.plugin('i18n').service('content-types').isLocalizedContentType(contentType)) {
    return;
  }

  const data = params.data || {};

  if (params.locale) {
    data.locale = params.locale;
  }

  params.data = data;
};
