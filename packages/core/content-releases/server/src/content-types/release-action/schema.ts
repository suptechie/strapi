import { RELEASE_MODEL_UID } from '../../constants';

export default {
  collectionName: 'strapi_release_actions',
  info: {
    singularName: 'release-action',
    pluralName: 'release-actions',
    displayName: 'Release Action',
  },
  options: {
    draftAndPublish: false,
  },
  pluginOptions: {
    'content-manager': {
      visible: false,
    },
    'content-type-builder': {
      visible: false,
    },
  },
  attributes: {
    type: {
      type: 'enumeration',
      enum: ['publish', 'unpublish'],
      required: true,
    },
    entry: {
      type: 'relation',
      relation: 'morphToOne',
      configurable: false,
    },
    contentType: {
      type: 'string',
      required: true,
    },
    release: {
      type: 'relation',
      relation: 'manyToOne',
      target: RELEASE_MODEL_UID,
      inversedBy: 'actions',
    },
  },
};
