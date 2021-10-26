'use strict';

const { createTestBuilder } = require('../../../../../test/helpers/builder');
const { createStrapiInstance } = require('../../../../../test/helpers/strapi');
const { createContentAPIRequest } = require('../../../../../test/helpers/request');

let strapi;
let rq;

const component = {
  name: 'somecomponent',
  attributes: {
    name: {
      type: 'string',
    },
  },
};

const ct = {
  displayName: 'withcomponent',
  singularName: 'withcomponent',
  pluralName: 'withcomponents',
  attributes: {
    field: {
      type: 'component',
      component: 'default.somecomponent',
      repeatable: false,
      required: true,
    },
  },
};

describe('Non repeatable and required component', () => {
  const builder = createTestBuilder();

  beforeAll(async () => {
    await builder
      .addComponent(component)
      .addContentType(ct)
      .build();

    strapi = await createStrapiInstance();
    rq = await createContentAPIRequest({ strapi });
    rq.setURLPrefix('/api/withcomponents');
  });

  afterAll(async () => {
    await strapi.destroy();
    await builder.cleanup();
  });

  describe('POST new entry', () => {
    test('Creating entry with JSON works', async () => {
      const { statusCode, body } = await rq.post('/', {
        body: {
          data: {
            field: {
              name: 'someString',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(statusCode).toBe(200);
      expect(body.data.attributes.field).toEqual(
        expect.objectContaining({
          id: expect.anything(),
          name: 'someString',
        })
      );
    });

    test('Creating a second entry works', async () => {
      const { statusCode, body } = await rq.post('/', {
        body: {
          data: {
            field: {
              name: 'someValue',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(statusCode).toBe(200);
      expect(body.data.attributes.field).toEqual(
        expect.objectContaining({
          id: expect.anything(),
          name: 'someValue',
        })
      );
    });

    test.each([[], 'someString', 128219, false])(
      'Throws if the field is not an object %p',
      async value => {
        const res = await rq.post('/', {
          body: {
            data: {
              field: value,
            },
          },
          qs: {
            populate: ['field'],
          },
        });

        expect(res.statusCode).toBe(400);
      }
    );

    test('Throws when sending a null value', async () => {
      const res = await rq.post('/', {
        body: {
          data: {
            field: null,
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(res.statusCode).toBe(400);
    });

    test('Throws when the component is not provided', async () => {
      const res = await rq.post('/', {
        body: {
          data: {},
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET entries', () => {
    test('Should return entries with their nested components', async () => {
      const { statusCode, body } = await rq.get('/', {
        qs: {
          populate: ['field'],
        },
      });

      expect(statusCode).toBe(200);

      expect(Array.isArray(body.data)).toBe(true);
      body.data.forEach(entry => {
        if (entry.attributes.field === null) return;

        expect(entry.attributes.field).toMatchObject({
          name: expect.any(String),
        });
      });
    });
  });

  describe('PUT entry', () => {
    test.each([[], 'someString', 128219, false])(
      'Throws when sending invalid updated field %p',
      async value => {
        const res = await rq.post('/', {
          body: {
            data: {
              field: {
                name: 'someString',
              },
            },
          },
          qs: {
            populate: ['field'],
          },
        });

        const updateRes = await rq.put(`/${res.body.data.id}`, {
          body: {
            data: {
              field: value,
            },
          },
          qs: {
            populate: ['field'],
          },
        });

        expect(updateRes.statusCode).toBe(400);

        // shouldn't have been updated
        const getRes = await rq.get(`/${res.body.data.id}`, {
          qs: {
            populate: ['field'],
          },
        });

        expect(getRes.statusCode).toBe(200);
        expect(getRes.body.data).toMatchObject(res.body.data);
      }
    );

    test('Keeps the previous value if component not sent', async () => {
      const res = await rq.post('/', {
        body: {
          data: {
            field: {
              name: 'someString',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.data.id}`, {
        body: {
          data: {},
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data).toMatchObject({
        id: res.body.data.id,
        attributes: {
          field: res.body.data.attributes.field,
        },
      });

      const getRes = await rq.get(`/${res.body.data.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.data).toMatchObject({
        id: res.body.data.id,
        attributes: {
          field: res.body.data.attributes.field,
        },
      });
    });

    test('Throws if component is null', async () => {
      const res = await rq.post('/', {
        body: {
          data: {
            field: {
              name: 'someString',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.data.id}`, {
        body: {
          data: {
            field: null,
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(400);

      const getRes = await rq.get(`/${res.body.data.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toMatchObject(res.body);
    });

    test('Replaces the previous component if sent without id', async () => {
      const res = await rq.post('/', {
        body: {
          data: {
            field: {
              name: 'someString',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.data.id}`, {
        body: {
          data: {
            field: {
              name: 'new String',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.attributes.field.id).not.toBe(res.body.data.attributes.field.id);
      expect(updateRes.body.data).toMatchObject({
        id: res.body.data.id,
        attributes: {
          field: {
            name: 'new String',
          },
        },
      });

      const getRes = await rq.get(`/${res.body.data.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.data).toMatchObject({
        id: res.body.data.id,
        attributes: {
          field: {
            name: 'new String',
          },
        },
      });
    });

    test('Throws on invalid id in component', async () => {
      const res = await rq.post('/', {
        body: {
          data: {
            field: {
              name: 'someString',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.data.id}`, {
        body: {
          data: {
            field: {
              id: 'invalid_id',
              name: 'new String',
            },
          },
        },
      });

      expect(updateRes.statusCode).toBe(400);
    });

    test('Updates component if previous component id is sent', async () => {
      const res = await rq.post('/', {
        body: {
          data: {
            field: {
              name: 'someString',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const updateRes = await rq.put(`/${res.body.data.id}`, {
        body: {
          data: {
            field: {
              id: res.body.data.attributes.field.id, // send old id to update the previous component
              name: 'new String',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const expectedResult = {
        id: res.body.data.id,
        attributes: {
          field: {
            id: res.body.data.attributes.field.id,
            name: 'new String',
          },
        },
      };

      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data).toMatchObject(expectedResult);

      const getRes = await rq.get(`/${res.body.data.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.data).toMatchObject(expectedResult);
    });
  });

  describe('DELETE entry', () => {
    test('Returns entry with components', async () => {
      const res = await rq.post('/', {
        body: {
          data: {
            field: {
              name: 'someString',
            },
          },
        },
        qs: {
          populate: ['field'],
        },
      });

      const deleteRes = await rq.delete(`/${res.body.data.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body).toMatchObject(res.body);

      const getRes = await rq.get(`/${res.body.data.id}`, {
        qs: {
          populate: ['field'],
        },
      });

      expect(getRes.statusCode).toBe(404);
    });
  });
});
