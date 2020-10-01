// Test a simple default API with no relations

const _ = require('lodash');

const { registerAndLogin } = require('../../../../test/helpers/auth');
const createModelsUtils = require('../../../../test/helpers/models');
const { createAuthRequest } = require('../../../../test/helpers/request');

let rq;
let modelsUtils;
let data = {
  productsWithCompoAndDP: [],
};

const compo = {
  name: 'compo',
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'text',
      minLength: 4,
      maxLength: 30,
    },
  },
};

const productWithCompoAndDP = {
  attributes: {
    name: {
      type: 'string',
    },
    description: {
      type: 'text',
    },
    compo: {
      type: 'component',
      component: 'default.compo',
      required: true,
      repeatable: true,
    },
  },
  connection: 'default',
  draftAndPublish: true,
  name: 'product with compo and DP',
  description: '',
  collectionName: '',
};

describe('CM API - Basic + compo + draftAndPublish', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);

    modelsUtils = createModelsUtils({ rq });
    await modelsUtils.createComponent(compo);
    await modelsUtils.createContentTypes([productWithCompoAndDP]);
  }, 60000);

  afterAll(async () => {
    // clean database
    const queryString = data.productsWithCompoAndDP.map((p, i) => `${i}=${p.id}`).join('&');
    await rq({
      method: 'DELETE',
      url: `/content-manager/explorer/deleteAll/application::product-with-compo-and-dp.product-with-compo-and-dp?${queryString}`,
    });

    await modelsUtils.deleteContentTypes(['product-with-compo-and-dp']);
    await modelsUtils.deleteComponent('default.compo');
  }, 60000);

  test('Create product with compo', async () => {
    const product = {
      name: 'Product 1',
      description: 'Product description',
      compo: [
        {
          name: 'compo name',
          description: 'short',
        },
      ],
    };
    const res = await rq({
      method: 'POST',
      url:
        '/content-manager/explorer/application::product-with-compo-and-dp.product-with-compo-and-dp',
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.published_at).toBeNull();
    data.productsWithCompoAndDP.push(res.body);
  });

  test('Read product with compo', async () => {
    const res = await rq({
      method: 'GET',
      url:
        '/content-manager/explorer/application::product-with-compo-and-dp.product-with-compo-and-dp',
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject(data.productsWithCompoAndDP[0]);
    res.body.forEach(p => {
      expect(p.published_at).toBeNull();
    });
  });

  test('Update product with compo', async () => {
    const product = {
      name: 'Product 1 updated',
      description: 'Updated Product description',
      compo: [
        {
          name: 'compo name updated',
          description: 'update',
        },
      ],
    };
    const res = await rq({
      method: 'PUT',
      url: `/content-manager/explorer/application::product-with-compo-and-dp.product-with-compo-and-dp/${data.productsWithCompoAndDP[0].id}`,
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.id).toEqual(data.productsWithCompoAndDP[0].id);
    expect(res.body.published_at).toBeNull();
    data.productsWithCompoAndDP[0] = res.body;
  });

  test('Delete product with compo', async () => {
    const res = await rq({
      method: 'DELETE',
      url: `/content-manager/explorer/application::product-with-compo-and-dp.product-with-compo-and-dp/${data.productsWithCompoAndDP[0].id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(data.productsWithCompoAndDP[0]);
    expect(res.body.id).toEqual(data.productsWithCompoAndDP[0].id);
    expect(res.body.published_at).toBeNull();
    data.productsWithCompoAndDP.shift();
  });

  describe('validation', () => {
    test('Can create product with compo - compo required - []', async () => {
      const product = {
        name: 'Product 1',
        description: 'Product description',
        compo: [],
      };
      const res = await rq({
        method: 'POST',
        url:
          '/content-manager/explorer/application::product-with-compo-and-dp.product-with-compo-and-dp',
        body: product,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(product);
      data.productsWithCompoAndDP.push(res.body);
    });

    test('Can create product with compo - minLength', async () => {
      const product = {
        name: 'Product 1',
        description: 'Product description',
        compo: [
          {
            name: 'compo name',
            description: '',
          },
        ],
      };
      const res = await rq({
        method: 'POST',
        url:
          '/content-manager/explorer/application::product-with-compo-and-dp.product-with-compo-and-dp',
        body: product,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(product);
      data.productsWithCompoAndDP.push(res.body);
    });

    test('Cannot create product with compo - maxLength', async () => {
      const product = {
        name: 'Product 1',
        description: 'Product description',
        compo: [
          {
            name: 'compo name',
            description: 'A very long description that exceed the min length.',
          },
        ],
      };
      const res = await rq({
        method: 'POST',
        url:
          '/content-manager/explorer/application::product-with-compo-and-dp.product-with-compo-and-dp',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res.body.data, ['errors', 'compo[0].description', '0'])).toBe(
        'compo[0].description must be at most 30 characters'
      );
    });

    test('Can create product with compo - required', async () => {
      const product = {
        name: 'Product 1',
        description: 'Product description',
        compo: [
          {
            description: 'short',
          },
        ],
      };
      const res = await rq({
        method: 'POST',
        url:
          '/content-manager/explorer/application::product-with-compo-and-dp.product-with-compo-and-dp',
        body: product,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(product);
      data.productsWithCompoAndDP.push(res.body);
    });
  });
});
