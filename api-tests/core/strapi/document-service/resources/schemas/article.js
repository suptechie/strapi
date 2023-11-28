'use strict';

module.exports = {
  kind: 'collectionType',
  collectionName: 'articles',
  singularName: 'article',
  pluralName: 'articles',
  displayName: 'Article',
  description: '',
  draftAndPublish: true,
  pluginOptions: {
    i18n: {
      localized: true,
    },
  },
  attributes: {
    title: {
      type: 'string',
      pluginOptions: {
        i18n: {
          localized: true,
        },
      },
    },
    password: {
      type: 'password',
      pluginOptions: {
        i18n: {
          localized: true,
        },
      },
    },
    private: {
      type: 'string',
      private: true,
      pluginOptions: {
        i18n: {
          localized: true,
        },
      },
    },
    comp: {
      type: 'component',
      repeatable: false,
      component: 'article.comp',
      pluginOptions: {
        i18n: {
          localized: true,
        },
      },
    },
    categories: {
      type: 'relation',
      relation: 'manyToMany',
      target: 'api::category.category',
    },
    dz: {
      pluginOptions: {
        i18n: {
          localized: true,
        },
      },
      type: 'dynamiczone',
      components: ['article.dz-comp', 'article.dz-other-comp'],
    },
  },
};
