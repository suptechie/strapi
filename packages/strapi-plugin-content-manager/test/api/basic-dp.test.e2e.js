const _ = require('lodash');

const { registerAndLogin } = require('../../../../test/helpers/auth');
const createModelsUtils = require('../../../../test/helpers/models');
const { createAuthRequest } = require('../../../../test/helpers/request');

let rq;
let modelsUtils;
let data = {
  productsWithDP: [],
};

const productWithDP = {
  attributes: {
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'text',
      minLength: 3,
      maxLength: 30,
    },
  },
  connection: 'default',
  draftAndPublish: true,
  name: 'product with DP',
  description: '',
  collectionName: '',
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

describe('CM API - Basic + draftAndPublish', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);

    modelsUtils = createModelsUtils({ rq });
    await modelsUtils.createComponent(compo);
    await modelsUtils.createContentTypes([productWithDP]);
  }, 60000);

  afterAll(async () => {
    // clean database
    const queryString = data.productsWithDP.map((p, i) => `${i}=${p.id}`).join('&');
    await rq({
      method: 'DELETE',
      url: `/content-manager/explorer/deleteAll/application::product-with-dp.product-with-dp?${queryString}`,
    });

    await modelsUtils.deleteContentTypes(['product-with-dp']);
    await modelsUtils.deleteComponent('default.compo');
  }, 60000);

  test('Create a product', async () => {
    const product = {
      name: 'Product 1',
      description: 'Product description',
    };
    const res = await rq({
      method: 'POST',
      url: '/content-manager/explorer/application::product-with-dp.product-with-dp',
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(product);
    expect(res.body.published_at).toBeNull();
    data.productsWithDP.push(res.body);
  });

  test('Create a product + cannot overwrite published_at', async () => {
    const product = {
      name: 'Product 2',
      description: 'Product description',
      published_at: '2020-08-20T10:27:55.866Z',
    };
    const res = await rq({
      method: 'POST',
      url: '/content-manager/explorer/application::product-with-dp.product-with-dp',
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(_.omit(product, 'published_at'));
    expect(res.body.published_at).toBeNull();
    data.productsWithDP.push(res.body);
  });

  test('Read all products', async () => {
    const res = await rq({
      method: 'GET',
      url: '/content-manager/explorer/application::product-with-dp.product-with-dp',
    });

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Product 1',
          description: 'Product description',
        }),
      ])
    );
    res.body.forEach(p => {
      expect(p.published_at).toBeNull();
    });
  });

  test('Update a draft', async () => {
    const product = {
      name: 'Product 1 updated',
      description: 'Updated Product description',
    };
    const res = await rq({
      method: 'PUT',
      url: `/content-manager/explorer/application::product-with-dp.product-with-dp/${data.productsWithDP[0].id}`,
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(_.omit(product, 'published_at'));
    expect(res.body.id).toEqual(data.productsWithDP[0].id);
    expect(res.body.published_at).toBeNull();
    data.productsWithDP[0] = res.body;
  });

  test('Update product + cannot overwrite published_at', async () => {
    const product = {
      name: 'Product 1 updated',
      description: 'Updated Product description',
      published_at: '2020-08-27T09:50:50.465Z',
    };
    const res = await rq({
      method: 'PUT',
      url: `/content-manager/explorer/application::product-with-dp.product-with-dp/${data.productsWithDP[0].id}`,
      body: product,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(_.omit(product, ['published_at']));
    expect(res.body.published_at).toBeNull();
    expect(res.body.id).toEqual(data.productsWithDP[0].id);
    data.productsWithDP[0] = res.body;
  });

  test('Publish a product, expect published_at to be defined', async () => {
    const entry = data.productsWithDP[0];

    let { body } = await rq({
      url: `/content-manager/explorer/application::product-with-dp.product-with-dp/publish/${entry.id}`,
      method: 'POST',
    });

    data.productsWithDP[0] = body;

    expect(body.published_at).toBeISODate();
  });

  test('Publish article1, expect article1 to be already published', async () => {
    const entry = data.productsWithDP[0];

    let { body } = await rq({
      url: `/content-manager/explorer/application::product-with-dp.product-with-dp/publish/${entry.id}`,
      method: 'POST',
    });

    expect(body.statusCode).toBe(400);
    expect(body.message).toBe('Already published');
  });

  test('Unpublish article1, expect article1 to be set to null', async () => {
    const entry = data.productsWithDP[0];

    let { body } = await rq({
      url: `/content-manager/explorer/application::product-with-dp.product-with-dp/unpublish/${entry.id}`,
      method: 'POST',
    });

    data.productsWithDP[0] = body;

    expect(body.published_at).toBeNull();
  });

  test('Unpublish article1, expect article1 to already be a draft', async () => {
    const entry = data.productsWithDP[0];

    let { body } = await rq({
      url: `/content-manager/explorer/application::product-with-dp.product-with-dp/unpublish/${entry.id}`,
      method: 'POST',
    });

    expect(body.statusCode).toBe(400);
    expect(body.message).toBe('Already a draft');
  });

  test('Delete a draft', async () => {
    const res = await rq({
      method: 'DELETE',
      url: `/content-manager/explorer/application::product-with-dp.product-with-dp/${data.productsWithDP[0].id}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(data.productsWithDP[0]);
    expect(res.body.id).toEqual(data.productsWithDP[0].id);
    expect(res.body.published_at).toBeNull();
    data.productsWithDP.shift();
  });

  describe('validators', () => {
    test('Can create a product - minLength', async () => {
      const product = {
        name: 'Product 1',
        description: '',
      };
      const res = await rq({
        method: 'POST',
        url: '/content-manager/explorer/application::product-with-dp.product-with-dp',
        body: product,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(product);
      data.productsWithDP.push(res.body);
    });

    test('Can create a product - required', async () => {
      const product = {
        description: 'Product description',
      };
      const res = await rq({
        method: 'POST',
        url: '/content-manager/explorer/application::product-with-dp.product-with-dp',
        body: product,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        ...product,
      });
      expect(_.isNil(res.body.name)).toBe(true);
      data.productsWithDP.push(res.body);
    });

    test('Cannot create a product - maxLength', async () => {
      const product = {
        name: 'Product 1',
        description: "I'm a product description that is very long. At least thirty characters.",
      };
      const res = await rq({
        method: 'POST',
        url: '/content-manager/explorer/application::product-with-dp.product-with-dp',
        body: product,
      });

      expect(res.statusCode).toBe(400);
      expect(_.get(res, 'body.data.errors.description.0')).toBe(
        'description must be at most 30 characters'
      );
    });
  });
});
