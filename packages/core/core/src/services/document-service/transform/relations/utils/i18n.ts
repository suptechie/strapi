import { Common } from '@strapi/types';
import { errors } from '@strapi/utils';
import { LongHandDocument } from './types';

export const isLocalizedContentType = (uid: Common.UID.Schema) => {
  const model = strapi.getModel(uid);
  return strapi.plugin('i18n').service('content-types').isLocalizedContentType(model);
};

export const getDefaultLocale = () => {
  // TODO: V5 make this more performant
  return strapi.plugin('i18n').service('locales').getDefaultLocale();
};

export const getRelationTargetLocale = (
  relation: LongHandDocument,
  opts: {
    targetUid: Common.UID.Schema;
    sourceUid: Common.UID.Schema;
    sourceLocale?: string | null;
  }
) => {
  const defaultLocale = getDefaultLocale();
  const targetLocale = relation.locale || opts.sourceLocale || defaultLocale;

  const isTargetLocalized = isLocalizedContentType(opts.targetUid);
  const isSourceLocalized = isLocalizedContentType(opts.sourceUid);

  // Locale validations
  if (isSourceLocalized && isTargetLocalized) {
    // Check the targetLocale matches
    if (targetLocale !== opts.sourceLocale) {
      throw new errors.ValidationError(
        `Relation locale does not match the source locale ${JSON.stringify(relation)}`
      );
    }
  }

  if (isTargetLocalized) {
    return targetLocale;
  }

  return null;
};
