import { DatabaseConfig } from '@strapi/database';
import { Schema, Attribute } from '@strapi/types';
import { createId } from '@paralleldrive/cuid2';

const transformAttribute = (attribute: Attribute.Any) => {
  switch (attribute.type) {
    case 'media': {
      return {
        type: 'relation',
        relation: attribute.multiple === true ? 'morphMany' : 'morphOne',
        target: 'plugin::upload.file',
        morphBy: 'related',
      };
    }
    default: {
      return attribute;
    }
  }
};

export const transformContentTypesToModels = (
  contentTypes: Pick<
    Schema.ContentType,
    'uid' | 'modelName' | 'collectionName' | 'attributes' | 'modelType'
  >[]
): DatabaseConfig['models'] => {
  return contentTypes.map((contentType) => {
    // Add document id to content types
    // @ts-expect-error - `default` function is not typed into `Attribute`
    // as it is not documented
    const documentIdAttribute: Record<string, Attribute.Any> =
      contentType.modelType === 'contentType'
        ? { documentId: { type: 'string', default: createId } }
        : {};

    const model = {
      ...contentType,
      // reuse new model def
      singularName: contentType.modelName,
      tableName: contentType.collectionName!,
      attributes: {
        ...documentIdAttribute,
        ...Object.keys(contentType.attributes! || {}).reduce((attrs, attrName) => {
          return Object.assign(attrs, {
            [attrName]: transformAttribute(contentType.attributes[attrName]!),
          });
        }, {}),
      },
    };

    return model;
  });
};
