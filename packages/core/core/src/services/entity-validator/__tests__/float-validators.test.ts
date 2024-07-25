import strapiUtils, { errors } from '@strapi/utils';
import type { Schema } from '@strapi/types';
import { Validators } from '../validators';
import { mockOptions } from './utils';

describe('Float validator', () => {
  const fakeModel: Schema.ContentType = {
    modelType: 'contentType',
    kind: 'collectionType',
    modelName: 'test-model',
    globalId: 'test-model',
    uid: 'api::test.test-uid',
    info: {
      displayName: 'Test model',
      singularName: 'test-model',
      pluralName: 'test-models',
    },
    options: {},
    attributes: {
      attrFloatUnique: { type: 'float', unique: true },
    },
  };

  describe('unique', () => {
    const fakeFindOne = jest.fn();

    global.strapi = {
      db: {
        query: () => ({
          findOne: fakeFindOne,
        }),
      },
    } as any;

    afterEach(() => {
      jest.clearAllMocks();
      fakeFindOne.mockReset();
    });

    test('it does not validates the unique constraint if the attribute is not set as unique', async () => {
      fakeFindOne.mockResolvedValueOnce(null);

      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float' },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 1 },
            entity: null,
          },
          mockOptions
        )
      );

      await validator(1);

      expect(fakeFindOne).not.toHaveBeenCalled();
    });

    test('it does not validates the unique constraint if the attribute value is `null`', async () => {
      fakeFindOne.mockResolvedValueOnce(null);

      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: null },
            entity: null,
          },
          mockOptions
        ).nullable()
      );

      await validator(null);

      expect(fakeFindOne).not.toHaveBeenCalled();
    });

    test('it validates the unique constraint if there is no other record in the database', async () => {
      fakeFindOne.mockResolvedValueOnce(null);

      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 2 },
            entity: null,
          },
          mockOptions
        )
      );

      expect(await validator(1)).toBe(1);
    });

    test('it fails the validation of the unique constraint if the database contains a record with the same attribute value', async () => {
      expect.assertions(1);
      fakeFindOne.mockResolvedValueOnce({ attrFloatUnique: 2 });

      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 2 },
            entity: null,
          },
          mockOptions
        )
      );

      try {
        await validator(2);
      } catch (err) {
        expect(err).toBeInstanceOf(errors.YupValidationError);
      }
    });

    test('it validates the unique constraint if the attribute data has not changed even if there is a record in the database with the same attribute value', async () => {
      fakeFindOne.mockResolvedValueOnce({ attrFloatUnique: 3 });

      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 3 },
            entity: { id: 1, attrFloatUnique: 3 },
          },
          mockOptions
        )
      );

      expect(await validator(3)).toBe(3);
    });

    test('it checks the database for records with the same value for the checked attribute', async () => {
      fakeFindOne.mockResolvedValueOnce(null);

      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 4 },
            entity: null,
          },
          mockOptions
        )
      );

      await validator(4);

      expect(fakeFindOne).toHaveBeenCalledWith({
        where: {
          locale: 'en',
          publishedAt: null,
          attrFloatUnique: 4,
        },
      });
    });

    test('it checks the database for records with the same value but not the same id for the checked attribute if an entity is passed', async () => {
      fakeFindOne.mockResolvedValueOnce(null);

      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 5 },
            entity: { id: 1, attrFloatUnique: 42 },
          },
          mockOptions
        )
      );

      await validator(5);

      expect(fakeFindOne).toHaveBeenCalledWith({
        where: {
          attrFloatUnique: 5,
          id: {
            $ne: 1,
          },
          locale: 'en',
          publishedAt: null,
        },
      });
    });
  });

  describe('min', () => {
    test('it fails the validation if the float is lower than the define min', async () => {
      expect.assertions(1);

      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', min: 3 },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 5 },
            entity: { id: 1, attrFloatUnique: 42 },
          },
          mockOptions
        )
      );

      try {
        await validator(1);
      } catch (err) {
        expect(err).toBeInstanceOf(errors.YupValidationError);
      }
    });

    test('it validates the min constraint if the float is higher than the define min', async () => {
      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', min: 3 },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 5 },
            entity: { id: 1, attrFloatUnique: 42 },
          },
          mockOptions
        )
      );

      expect(await validator(4)).toBe(4);
    });
  });

  describe('max', () => {
    test('it fails the validation if the number is float than the define max', async () => {
      expect.assertions(1);

      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', max: 3 },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 5 },
            entity: { id: 1, attrFloatUnique: 42 },
          },
          mockOptions
        )
      );

      try {
        await validator(4);
      } catch (err) {
        expect(err).toBeInstanceOf(errors.YupValidationError);
      }
    });

    test('it validates the max constraint if the float is lower than the define max', async () => {
      const validator = strapiUtils.validateYupSchema(
        Validators.float(
          {
            attr: { type: 'float', max: 3 },
            model: fakeModel,
            updatedAttribute: { name: 'attrFloatUnique', value: 5 },
            entity: { id: 1, attrFloatUnique: 42 },
          },
          mockOptions
        )
      );

      expect(await validator(2)).toBe(2);
    });
  });
});
