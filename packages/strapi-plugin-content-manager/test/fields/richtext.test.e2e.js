'use strict';

const { registerAndLogin } = require('../../../../test/helpers/auth');
const createModelsUtils = require('../../../../test/helpers/models');
const { createAuthRequest } = require('../../../../test/helpers/request');

let modelsUtils;
let rq;

describe('Test type richtext', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);

    modelsUtils = createModelsUtils({ rq });

    await modelsUtils.createContentTypeWithType('withrichtext', 'richtext');
  }, 60000);

  afterAll(async () => {
    await modelsUtils.deleteContentType('withrichtext');
  }, 60000);

  test('Creates an entry with JSON', async () => {
    const res = await rq.post(
      '/content-manager/collection-types/application::withrichtext.withrichtext',
      {
        body: {
          field: 'Some\ntext',
        },
      }
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      field: 'Some\ntext',
    });
  });

  test('Reading entry, returns correct value', async () => {
    const res = await rq.get(
      '/content-manager/collection-types/application::withrichtext.withrichtext'
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(Array.isArray(res.body.results)).toBe(true);
    res.body.results.forEach(entry => {
      expect(entry.field).toEqual(expect.any(String));
    });
  });

  test('Updating entry with JSON sets the right value and format', async () => {
    const res = await rq.post(
      '/content-manager/collection-types/application::withrichtext.withrichtext',
      {
        body: { field: 'Some \ntext' },
      }
    );

    const updateRes = await rq.put(
      `/content-manager/collection-types/application::withrichtext.withrichtext/${res.body.id}`,
      {
        body: { field: 'Updated \nstring' },
      }
    );
    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body).toMatchObject({
      id: res.body.id,
      field: 'Updated \nstring',
    });
  });
});
