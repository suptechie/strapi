'use strict';

const { createTestBuilder } = require('../../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../../test/helpers/strapi');
const { createAuthRequest } = require('../../../../../test/helpers/request');

const builder = createTestBuilder();
let strapi;
let rq;

const dogModel = {
  displayName: 'Dog',
  singularName: 'dog',
  pluralName: 'dogs',
  kind: 'collectionType',
  attributes: {
    profilePicture: {
      type: 'media',
    },
  },
};

describe('Upload', () => {
  beforeAll(async () => {
    await builder.addContentType(dogModel).build();
    strapi = await createStrapiInstance();
    rq = await createAuthRequest({ strapi });
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('Create', () => {
    test('Rejects when no files are provided', async () => {
      const res = await rq({ method: 'POST', url: '/upload', formData: {} });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Read', () => {
    test('GET /upload/files => Find files', async () => {
      const getRes = await rq({ method: 'GET', url: '/upload/files' });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toEqual({
        results: expect.arrayContaining([
          expect.objectContaining({
            id: expect.anything(),
            url: expect.any(String),
          }),
        ]),
        pagination: {
          page: expect.any(Number),
          pageSize: expect.any(Number),
          pageCount: expect.any(Number),
          total: expect.any(Number),
        },
      });
    });
  });
});
