import { errors } from '@strapi/utils';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import * as qs from 'qs';

import { COLLECTION_TYPES, SINGLE_TYPES } from '../src/content-manager/constants/collections';
import { historyHandlers } from '../src/content-manager/history/tests/server';

import { MockData, mockData } from './mockData';

export const server = setupServer(
  ...[
    /**
     * TRACKING
     */
    rest.post('https://analytics.strapi.io/api/v2/track', (req, res, ctx) => {
      return res(ctx.status(200));
    }),
    /**
     *
     * ADMIN ROLES
     *
     */
    rest.get('/admin/roles', (req, res, ctx) =>
      res(
        ctx.json({
          data: [
            {
              id: 1,
              code: 'strapi-editor',
              name: 'Editor',
            },
            {
              id: 2,
              code: 'strapi-author',
              name: 'Author',
            },
          ],
        })
      )
    ),

    rest.get('/admin/roles/1', (req, res, ctx) =>
      res(
        ctx.json({
          data: {
            id: 1,
            code: 'strapi-editor',
            params: {
              filters: req.url.searchParams.get('filters'),
            },
          },
        })
      )
    ),
    rest.get('/admin/roles/:id/permissions', (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            {
              id: 1,
              action: 'plugin::content-manager.explorer.create',
              subject: 'api::address.address',
              properties: {
                fields: ['postal_code', 'categories'],
              },
              conditions: [],

              params: {
                filters: req.url.searchParams.get('filters'),
              },
            },
          ],
        })
      );
    }),
    /**
     *
     * ADMIN USERS
     *
     */
    rest.get('/admin/users', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            results: [
              { id: 1, firstname: 'John', lastname: 'Doe', roles: [] },
              { id: 2, firstname: 'Kai', lastname: 'Doe', roles: [] },
            ],
            pagination: {
              page: 1,
            },
          },
        })
      );
    }),
    rest.get('/admin/users/1', (req, res, ctx) =>
      res(
        ctx.json({
          data: {
            id: 1,
            firstname: 'John',
            lastname: 'Doe',
            emai: 'test@testing.com',
            roles: [
              { id: 1, code: 'strapi-editor', name: 'Editor' },
              { id: 2, code: 'strapi-super-admin', name: 'Super Admin' },
            ],
            params: {
              some: req.url.searchParams.get('some'),
            },
          },
        })
      )
    ),
    rest.get('/admin/users/me', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            email: 'michka@michka.fr',
            firstname: 'michoko',
            lastname: 'ronronscelestes',
            username: 'yolo',
            preferedLanguage: 'en',
            roles: [
              {
                id: 2,
              },
            ],
          },
        })
      );
    }),
    rest.get('/admin/users/me/permissions', (req, res, ctx) => res(ctx.json({ data: [] }))),
    /**
     *
     * ADMIN PROVIDERS
     *
     */
    rest.get('/admin/providers/isSSOLocked', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            isSSOLocked: false,
          },
        })
      );
    }),
    rest.put('/admin/providers/options', (req, res, ctx) =>
      res(
        ctx.json({
          data: {
            autoRegister: false,
            defaultRole: '1',
            ssoLockedRoles: ['1', '2', '3'],
          },
        })
      )
    ),
    rest.get('/admin/providers/options', (req, res, ctx) =>
      res(
        ctx.json({
          data: {
            autoRegister: false,
            defaultRole: '1',
            ssoLockedRoles: ['1', '2'],
          },
        })
      )
    ),
    /**
     *
     * ADMIN PERMISSIONS
     *
     */
    rest.get('/admin/permissions', (req, res, ctx) => {
      const role = req.url.searchParams.get('role');

      if (role !== '1') {
        return res(ctx.status(404));
      }

      return res(
        ctx.json({
          data: {
            conditions: [
              {
                id: 'admin::is-creator',
                displayName: 'Is creator',
                category: 'default',
              },
            ],
            sections: {
              settings: [
                {
                  displayName: 'Access the Email Settings page',
                  category: 'email',
                  subCategory: 'general',
                  action: 'plugin::email.settings.read',
                },
              ],
            },
          },
        })
      );
    }),
    /**
     *
     * ADMIN MISC
     *
     */
    rest.get('/admin/init', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {},
        })
      );
    }),
    rest.get('/admin/information', (req, res, ctx) =>
      res(
        ctx.json({
          autoReload: true,
          communityEdition: false,
          currentEnvironment: 'development',
          nodeVersion: 'v14.13.1',
          strapiVersion: '3.6.0',
        })
      )
    ),
    rest.get('/admin/license-limit-information', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            attribute: 1,

            features: [{ name: 'sso' }, { name: 'audit-logs', options: { retentionDays: 1 } }],
          },
        })
      );
    }),
    rest.get('/admin/project-settings', (req, res, ctx) => {
      return res(
        ctx.json({
          menuLogo: {
            ext: '.svg',
            height: 256,
            name: 'michka.svg',
            size: 1.3,
            url: '/uploads/michka.svg',
            width: 256,
          },
        })
      );
    }),
    rest.post('/admin/project-settings', (req, res, ctx) => {
      return res(
        ctx.json({
          menuLogo: {
            ext: '.svg',
            height: 256,
            name: 'michka.svg',
            size: 1.3,
            url: '/uploads/michka.svg',
            width: 256,
          },
        })
      );
    }),
    rest.get('/admin/transfer/tokens', (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            {
              id: 1,
              name: 'My super token',
              description: 'This describe my super token',
              type: 'read-only',
              createdAt: '2021-11-15T00:00:00.000Z',
              permissions: [],
            },
          ],
        })
      );
    }),
    rest.get('/admin/transfer/tokens/:id', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            id: 1,
            name: 'My super token',
            description: 'This describe my super token',
            type: 'read-only',
            createdAt: '2021-11-15T00:00:00.000Z',
            permissions: [],
          },
        })
      );
    }),
    rest.get('/admin/registration-info', async (req, res, ctx) => {
      const token = req.url.searchParams.get('registrationToken');

      if (token === 'error') {
        return res(ctx.status(500), ctx.json({}));
      }

      return res(
        ctx.json({
          data: {
            firstname: 'Token firstname',
            lastname: 'Token lastname',
            email: 'test+register-token@strapi.io',
          },
        })
      );
    }),
    rest.post('/admin/renew-token', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            token: 'renewed-test-token',
          },
        })
      );
    }),
    /**
     * WEBHOOKS
     */
    rest.get('/admin/webhooks', (req, res, ctx) => {
      return res(
        ctx.json({
          data: mockData.webhooks,
        })
      );
    }),
    rest.post('/admin/webhooks/batch-delete', async (req, res, ctx) => {
      const { ids } = await req.json<{ ids: number[] }>();

      return res(
        ctx.json({
          data: mockData.webhooks.filter((webhook) => !ids.includes(webhook.id)),
        })
      );
    }),
    rest.put('/admin/webhooks/:id', async (req, res, ctx) => {
      const { id } = req.params;
      const { isEnabled } = await req.json<{ isEnabled: boolean }>();

      return res(
        ctx.json({
          data: mockData.webhooks.map((webhook) =>
            webhook.id === Number(id) ? { ...webhook, isEnabled } : webhook
          ),
        })
      );
    }),
    /**
     * REVIEW_WORKFLOWS
     */
    rest.get('/admin/review-workflows/workflows', (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            {
              id: 1,
              stages: [
                {
                  id: 1,
                  name: 'To Review',
                  color: '#FFFFFF',
                },
              ],
            },
          ],
        })
      );
    }),
    rest.get('/admin/review-workflows/workflows/:id', (req, res, ctx) =>
      res(
        ctx.json({
          data: {
            id: 1,
            stages: [
              {
                id: 1,
                name: 'To Review',
                color: '#FFFFFF',
              },
            ],
          },
        })
      )
    ),
    rest.get('/content-manager/collection-types/:contentType/stages', (req, res, ctx) =>
      res(
        ctx.json({
          data: [
            {
              id: 1,
              name: 'Todo',
            },

            {
              id: 2,
              name: 'Done',
            },
          ],

          meta: {
            workflowCount: 10,
            stagesCount: 5,
          },
        })
      )
    ),
    rest.get('/content-manager/single-types/:contentType/stages', (req, res, ctx) =>
      res(
        ctx.json({
          data: [
            {
              id: 2,
              name: 'Todo',
            },

            {
              id: 3,
              name: 'Done',
            },
          ],

          meta: {
            workflowCount: 10,
            stagesCount: 5,
          },
        })
      )
    ),
    rest.put(
      '/admin/content-manager/collection-types/:contentType/:id/assignee',
      (req, res, ctx) => {
        return res(ctx.status(200));
      }
    ),
    rest.get('/admin/content-manager/:collectionType/:contentType/:id/stages', (req, res, ctx) =>
      res(
        ctx.json({
          data: [
            {
              id: 1,
              color: '#4945FF',
              name: 'Stage 1',
            },

            {
              id: 2,
              color: '#4945FF',
              name: 'Stage 2',
            },
          ],
          meta: {
            workflowCount: 10,
          },
        })
      )
    ),
    /**
     *
     * CONTENT_MANAGER
     *
     */
    rest.put('/content-manager/content-types/:model/configuration', (req, res, ctx) => {
      return res(ctx.status(200));
    }),
    rest.get('/content-manager/content-types/:model/configuration', (req, res, ctx) => {
      const configuration =
        req.params.model === 'api::homepage.homepage'
          ? mockData.contentManager.singleTypeConfiguration
          : mockData.contentManager.collectionTypeConfiguration;

      return res(
        ctx.json({
          data: configuration,
        })
      );
    }),
    rest.get('/content-manager/:collectionType/:uid/:id', (req, res, ctx) => {
      const { id, collectionType, uid } = req.params;

      if (id === 'configuration') {
        return;
      }

      if (
        id === '12345' &&
        collectionType === COLLECTION_TYPES &&
        uid === mockData.contentManager.contentType
      ) {
        return res(
          ctx.json({
            data: {
              documentId: id,
              id: 1,
              name: 'Entry 1',
              createdAt: '',
              updatedAt: '',
              publishedAt: '',
            },
          })
        );
      } else {
        return res(
          ctx.status(404),
          ctx.json({ error: new errors.NotFoundError('Document not found') })
        );
      }
    }),
    rest.put('/content-manager/:collectionType/:uid/:id', async (req, res, ctx) => {
      const { id, collectionType, uid } = req.params;
      const data = await req.json();

      if (
        id === '12345' &&
        collectionType === COLLECTION_TYPES &&
        uid === mockData.contentManager.contentType
      ) {
        return res(
          ctx.json({
            data: {
              documentId: id,
              id: 1,
              name: 'Entry 1',
              ...data,
              createdAt: '',
              updatedAt: '',
              publishedAt: '',
            },
          })
        );
      }

      return res(
        ctx.status(404),
        ctx.json({
          error: new errors.NotFoundError('Document not found'),
        })
      );
    }),
    rest.post('/content-manager/:collectionType/:uid', async (req, res, ctx) => {
      const data = await req.json();

      if (
        req.params.collectionType !== SINGLE_TYPES &&
        req.params.collectionType !== COLLECTION_TYPES
      ) {
        return;
      }

      return res(
        ctx.json({
          data: {
            documentId: '12345',
            id: 1,
            ...data,
          },
        })
      );
    }),
    rest.post('/content-manager/:collectionType/:uid/clone/:id', async (req, res, ctx) => {
      const data = await req.json();

      return res(
        ctx.json({
          data: {
            documentId: '67890',
            id: 2,
            ...data,
          },
        })
      );
    }),
    rest.post('/content-manager/:collectionType/:uid/:id/actions/discard', (req, res, ctx) => {
      const { id } = req.params;

      if (id === '12345') {
        return res(
          ctx.status(200),
          ctx.json({
            documentId: id,
            id: 1,
            title: 'test',
          })
        );
      }

      return res(
        ctx.status(404),
        ctx.json({
          error: new errors.NotFoundError('Document not found'),
        })
      );
    }),
    rest.post(
      '/content-manager/:collectionType/:uid/:id/actions/publish',
      async (req, res, ctx) => {
        const { id } = req.params;

        if (id === '12345') {
          return res(
            ctx.status(200),
            ctx.json({
              documentId: id,
              id: 1,
              title: 'test',
              publishedAt: '2024-01-23T16:23:38.948Z',
            })
          );
        }

        return res(
          ctx.status(404),
          ctx.json({
            error: new errors.NotFoundError('Document not found'),
          })
        );
      }
    ),
    rest.post(
      '/content-manager/:collectionType/:uid/:id/actions/unpublish',
      async (req, res, ctx) => {
        const { id } = req.params;

        if (id === '12345') {
          return res(
            ctx.status(200),
            ctx.json({
              documentId: id,
              id: 1,
              title: 'test',
              publishedAt: null,
            })
          );
        }

        return res(
          ctx.status(404),
          ctx.json({
            error: new errors.NotFoundError('Document not found'),
          })
        );
      }
    ),
    rest.delete('/content-manager/:collectionType/:uid/:id', (req, res, ctx) => {
      const { id } = req.params;

      if (id === '12345') {
        return res(
          ctx.status(200),
          ctx.json({
            documentId: id,
            id: 1,
            title: 'test',
          })
        );
      }

      return res(
        ctx.status(404),
        ctx.json({
          error: new errors.NotFoundError('Document not found'),
        })
      );
    }),
    rest.get('/content-manager/init', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            components: mockData.contentManager.components,
            contentTypes: mockData.contentManager.contentTypes,
          },
        })
      );
    }),
    rest.post('/content-manager/uid/generate', async (req, res, ctx) => {
      const body = await req.json();

      return res(
        ctx.json({
          data: body?.data?.target ?? 'regenerated',
        })
      );
    }),
    rest.post('/content-manager/uid/check-availability', async (req, res, ctx) => {
      const body = await req.json();

      return res(
        ctx.json({
          isAvailable: body?.value === 'available',
        })
      );
    }),
    rest.get('/content-manager/collection-types/:contentType', (req, res, ctx) => {
      return res(
        ctx.json({
          results: [
            {
              documentId: '12345',
              id: 1,
              name: 'Entry 1',
              publishedAt: null,
              notrepeat_req: {},
            },
            {
              documentId: '67890',
              id: 2,
              name: 'Entry 2',
              publishedAt: null,
              notrepeat_req: {},
            },
            {
              documentId: 'abcde',
              id: 3,
              name: 'Entry 3',
              publishedAt: null,
              notrepeat_req: {},
            },
          ],
        })
      );
    }),
    rest.get('/content-manager/content-types', (req, res, ctx) =>
      res(
        ctx.json({
          data: [
            {
              uid: 'admin::collectionType',
              isDisplayed: true,
              apiID: 'permission',
              kind: 'collectionType',
            },

            {
              uid: 'admin::collectionTypeNotDispalyed',
              isDisplayed: false,
              apiID: 'permission',
              kind: 'collectionType',
            },

            {
              uid: 'admin::singleType',
              isDisplayed: true,
              kind: 'singleType',
            },

            {
              uid: 'admin::singleTypeNotDispalyed',
              isDisplayed: false,
              kind: 'singleType',
            },
          ],
        })
      )
    ),
    rest.get('/content-manager/components', (req, res, ctx) =>
      res(
        ctx.json({
          data: [
            {
              uid: 'basic.relation',
              isDisplayed: true,
              apiID: 'relation',
              category: 'basic',
              info: {
                displayName: 'Relation',
              },
              options: {},
              attributes: {
                id: {
                  type: 'integer',
                },
                categories: {
                  type: 'relation',
                  relation: 'oneToMany',
                  target: 'api::category.category',
                  targetModel: 'api::category.category',
                  relationType: 'oneToMany',
                },
              },
            },
          ],
        })
      )
    ),
    rest.post(
      '/content-manager/collection-types/:contentType/actions/bulkPublish',
      (req, res, ctx) => {
        return res(
          ctx.json({
            data: {
              count: 3,
            },
          })
        );
      }
    ),
    rest.get(
      '/content-manager/collection-types/:contentType/actions/countManyEntriesDraftRelations',
      (req, res, ctx) => {
        return res(
          ctx.json({
            data: 0,
          })
        );
      }
    ),
    rest.get('/content-manager/relations/:model/:id/:fieldName', (req, res, ctx) => {
      return res(
        ctx.json({
          results: [
            {
              id: 1,
              documentId: 'apples',
              locale: 'en',
              status: 'draft',
              name: 'Relation entity 1',
            },
            {
              id: 2,
              documentId: 'bananas',
              locale: 'en',
              status: 'published',
              name: 'Relation entity 2',
            },
            {
              id: 3,
              documentId: 'pears',
              locale: 'en',
              status: 'modified',
              name: 'Relation entity 3',
            },
          ],
          pagination: {
            page: 1,
            pageCount: 1,
            total: 3,
          },
        })
      );
    }),
    rest.get('/content-manager/relations/:model/:fieldName', (req, res, ctx) => {
      return res(
        ctx.json({
          results: [
            {
              id: 1,
              documentId: 'apples',
              locale: 'en',
              status: 'draft',
              name: 'Relation entity 1',
            },
            {
              id: 2,
              documentId: 'bananas',
              locale: 'en',
              status: 'published',
              name: 'Relation entity 2',
            },
            {
              id: 3,
              documentId: 'pears',
              locale: 'en',
              status: 'modified',
              name: 'Relation entity 3',
            },
          ],
          pagination: {
            page: 1,
            pageCount: 1,
            total: 3,
          },
        })
      );
    }),
    /**
     *
     * MARKETPLACE
     *
     */
    rest.get('https://market-api.strapi.io/providers', (req, res, ctx) => {
      const { collections = [], search = '' } = qs.parse(req.url.searchParams.toString()) as {
        collections: Array<keyof MockData['marketplace']['providers']>;
        search: string;
      };

      const [madeByStrapi, verified] = collections;

      let responseData;

      const providerResponses = mockData.marketplace.providers;

      if (madeByStrapi && verified) {
        responseData = {
          data: [...providerResponses[madeByStrapi].data, ...providerResponses[verified].data],
          meta: providerResponses.providers.meta,
        };
      } else if (collections.length) {
        responseData = providerResponses[collections[0]];
      } else {
        responseData = providerResponses.providers;
      }

      const filteredResponse = {
        ...responseData,
        data: responseData.data.filter((provider) => {
          const nameMatch = provider.attributes.name.toLowerCase().includes(search.toLowerCase());
          const descriptionMatch = provider.attributes.description
            .toLowerCase()
            .includes(search.toLowerCase());

          return nameMatch || descriptionMatch;
        }),
      };

      return res(ctx.status(200), ctx.json(filteredResponse));
    }),
    rest.get('https://market-api.strapi.io/plugins', (req, res, ctx) => {
      const {
        collections = [],
        categories = [],
        search = '',
      } = qs.parse(req.url.searchParams.toString()) as {
        collections: Array<keyof MockData['marketplace']['plugins']>;
        categories: Array<keyof MockData['marketplace']['plugins']>;
        search: string;
      };
      const [madeByStrapi, verified] = collections;
      const [customFields, monitoring] = categories;

      let responseData;
      const pluginResponses = mockData.marketplace.plugins;

      if (categories.length && collections.length) {
        responseData = {
          data: [...pluginResponses[collections[0]].data, ...pluginResponses[categories[0]].data],
          meta: pluginResponses.plugins.meta,
        };
      } else if (madeByStrapi && verified) {
        responseData = {
          data: [...pluginResponses[madeByStrapi].data, ...pluginResponses[verified].data],
          meta: pluginResponses.plugins.meta,
        };
      } else if (customFields && monitoring) {
        responseData = {
          data: [...pluginResponses[customFields].data, ...pluginResponses[monitoring].data],
          meta: pluginResponses.plugins.meta,
        };
      } else if (collections.length) {
        responseData = pluginResponses[collections[0]];
      } else if (categories.length) {
        responseData = pluginResponses[categories[0]];
      } else {
        responseData = pluginResponses.plugins;
      }

      const filteredResponse = {
        ...responseData,
        data: responseData.data.filter((plugin) => {
          const nameMatch = plugin.attributes.name.toLowerCase().includes(search.toLowerCase());
          const descriptionMatch = plugin.attributes.description
            .toLowerCase()
            .includes(search.toLowerCase());

          return nameMatch || descriptionMatch;
        }),
      };

      return res(ctx.status(200), ctx.json(filteredResponse));
    }),
    /**
     *
     * NPS SURVEY
     *
     */
    rest.post('https://analytics.strapi.io/submit-nps', (req, res, ctx) => {
      return res(ctx.status(200));
    }),
    /**
     * CONTENT-API (API TOKENS)
     */
    rest.get('/admin/content-api/permissions', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            'api::address': {
              controllers: {
                address: ['find', 'findOne'],
              },
            },
            'plugin::myplugin': {
              controllers: {
                test: ['findOne', 'find'],
              },
            },
          },
        })
      );
    }),
    rest.get('/admin/content-api/routes', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            'api::address': [
              {
                method: 'GET',
                path: '/api/addresses',
                handler: 'api::address.address.find',
                config: {
                  auth: {
                    scope: ['api::address.address.find'],
                  },
                },
                info: {
                  apiName: 'address',
                  type: 'content-api',
                },
              },
              {
                method: 'GET',
                path: '/api/addresses/:id',
                handler: 'api::address.address.findOne',
                config: {
                  auth: {
                    scope: ['api::address.address.findOne'],
                  },
                },
                info: {
                  apiName: 'address',
                  type: 'content-api',
                },
              },
            ],
            'plugin::myplugin': [
              {
                method: 'GET',
                path: '/api/myplugin/tests',
                handler: 'plugin::myplugin.test.find',
                config: {
                  auth: {
                    scope: ['plugin::myplugin.test.find'],
                  },
                },
                info: {
                  pluginName: 'myplugin',
                  type: 'content-api',
                },
              },
              {
                method: 'GET',
                path: '/api/myplugin/tests/:id',
                handler: 'plugin::myplugin.test.findOne',
                config: {
                  auth: {
                    scope: ['plugin::myplugin.test.findOne'],
                  },
                },
                info: {
                  pluginName: 'myplugin',
                  type: 'content-api',
                },
              },
            ],
          },
        })
      );
    }),
    /**
     * API TOKENS
     */
    rest.get('/admin/api-tokens', (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            {
              id: '1',
              name: 'My super token',
              description: 'This describe my super token',
              type: 'read-only',
              createdAt: '2021-11-15T00:00:00.000Z',
              permissions: [],
            },
          ],
        })
      );
    }),
    rest.get('/admin/api-tokens/:id', (req, res, ctx) => {
      return res(
        ctx.json({
          data: {
            id: '1',
            name: 'My super token',
            description: 'This describe my super token',
            type: 'read-only',
            createdAt: '2021-11-15T00:00:00.000Z',
            permissions: [],
          },
        })
      );
    }),
    /**
     * Audit Logs
     */
    rest.get('/admin/audit-logs', (req, res, ctx) => {
      return res(
        ctx.json({
          results: [
            {
              id: 1,
              action: 'admin.logout',
              date: '2023-10-31T15:56:54.873Z',
              payload: {
                user: {
                  id: 1,
                  firstname: 'test',
                  lastname: 'testing',
                  username: null,
                  email: 'test@testing.com',
                  isActive: true,
                  blocked: false,
                  preferedLanguage: null,
                  createdAt: '2023-10-26T19:19:38.245Z',
                  updatedAt: '2023-10-26T19:19:38.245Z',
                  roles: [
                    {
                      id: 1,
                      name: 'Super Admin',
                      description: 'Super Admins can access and manage all features and settings.',
                      code: 'strapi-super-admin',
                    },
                  ],
                },
              },
              user: {
                id: 1,
                email: 'test@testing.com',
                displayName: 'test testing',
              },
            },
            {
              id: 2,
              action: 'user.create',
              date: '2023-10-31T15:57:38.957Z',
              payload: {
                user: {
                  id: 2,
                  firstname: 'editor',
                  lastname: 'test',
                  username: null,
                  email: 'editor@testing.com',
                  isActive: true,
                  blocked: false,
                  preferedLanguage: null,
                  createdAt: '2023-10-31T15:57:38.948Z',
                  updatedAt: '2023-10-31T15:57:38.948Z',
                  roles: [
                    {
                      id: 2,
                      name: 'Editor',
                      description:
                        'Editors can manage and publish contents including those of other users.',
                      code: 'strapi-editor',
                    },
                  ],
                },
              },
              user: {
                id: 1,
                email: 'test@testing.com',
                displayName: 'test testing',
              },
            },
          ],
          pagination: {
            page: 1,
            pageSize: 2,
            pageCount: 1,
            total: 2,
          },
        })
      );
    }),
    rest.get('/admin/audit-logs/:id', (req, res, ctx) => {
      return res(
        ctx.json({
          id: 1,
          action: 'admin.logout',
          date: '2023-10-31T15:56:54.873Z',
          payload: {
            user: {
              id: 1,
              firstname: 'test',
              lastname: 'testing',
              username: null,
              email: 'test@testing.com',
              isActive: true,
              blocked: false,
              preferedLanguage: null,
              createdAt: '2023-10-26T19:19:38.245Z',
              updatedAt: '2023-10-26T19:19:38.245Z',
              roles: [
                {
                  id: 1,
                  name: 'Super Admin',
                  description: 'Super Admins can access and manage all features and settings.',
                  code: 'strapi-super-admin',
                },
              ],
            },
          },
          user: {
            id: 1,
            email: 'test@testing.com',
            displayName: 'test testing',
          },
        })
      );
    }),
    /**
     * Content History
     */
    ...historyHandlers,
  ]
);
