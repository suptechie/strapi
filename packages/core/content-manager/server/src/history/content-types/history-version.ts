import type { Schema } from '@strapi/types';

const historyVersion: { schema: Schema.CollectionType } = {
  schema: {
    uid: 'plugin::content-manager.history-version',
    modelName: 'history-version',
    globalId: 'ContentManagerHistoryVersion',
    kind: 'collectionType',
    modelType: 'contentType',
    collectionName: 'strapi_history_versions',
    info: {
      singularName: 'history-version',
      pluralName: 'history-versions',
      displayName: 'History Version',
    },
    pluginOptions: {
      'content-manager': {
        visible: false,
      },
      'content-type-builder': {
        visible: false,
      },
      i18n: {
        localized: false,
      },
    },
    attributes: {
      contentType: {
        type: 'string',
        required: true,
      },
      // documentId is a reserved attribute name
      relatedDocumentId: {
        type: 'string',
        required: true,
      },
      locale: {
        type: 'string',
        required: false,
      },
      status: {
        type: 'enumeration',
        enum: ['draft', 'published', 'modified'],
      },
      data: {
        type: 'json',
      },
      schema: {
        type: 'json',
      },
      createdAt: {
        type: 'date',
      },
      createdBy: {
        type: 'relation',
        relation: 'oneToOne',
        target: 'admin::user',
      },
    },
  },
};

export { historyVersion };
