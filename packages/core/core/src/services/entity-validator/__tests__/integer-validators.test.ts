import strapiUtils, { errors } from '@strapi/utils';
import type { Schema } from '@strapi/types';
import validators from '../validators';
import { mockOptions } from './utils';

describe('Integer validator', () => {
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
      attrIntegerUnique: { type: 'integer', unique: true },
    },
  };

  describe('unique', () => {
    const fakeFindFirst = jest.fn();

    global.strapi = {
      db: {
        query: () => ({
          findOne: fakeFindFirst,
        }),
      },
    } as any;

    afterEach(() => {
      jest.clearAllMocks();
      fakeFindFirst.mockReset();
    });

    test('it does not validates the unique constraint if the attribute is not set as unique', async () => {
      fakeFindFirst.mockResolvedValueOnce(null);

      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer' },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: 1 },
            entity: null,
          },
          mockOptions
        )
      );

      await validator(1);

      expect(fakeFindFirst).not.toHaveBeenCalled();
    });

    test('it does not validates the unique constraint if the attribute value is `null`', async () => {
      fakeFindFirst.mockResolvedValueOnce(null);

      const validator = strapiUtils.validateYupSchema(
        validators
          .integer(
            {
              attr: { type: 'integer', unique: true },
              model: fakeModel,
              updatedAttribute: { name: 'attrIntegerUnique', value: null },
              entity: null,
            },
            mockOptions
          )
          .nullable()
      );

      await validator(null);

      expect(fakeFindFirst).not.toHaveBeenCalled();
    });

    test('it validates the unique constraint if there is no other record in the database', async () => {
      fakeFindFirst.mockResolvedValueOnce(null);

      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: 2 },
            entity: null,
          },
          mockOptions
        )
      );

      expect(await validator(1)).toBe(1);
    });

    test('it fails the validation of the unique constraint if the database contains a record with the same attribute value', async () => {
      expect.assertions(1);
      fakeFindFirst.mockResolvedValueOnce({ attrIntegerUnique: 2 });

      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: 2 },
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
      fakeFindFirst.mockResolvedValueOnce({ attrIntegerUnique: 3 });

      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: 3 },
            entity: { id: 1, attrIntegerUnique: 3 },
          },
          mockOptions
        )
      );

      expect(await validator(3)).toBe(3);
    });

    test('it checks the database for records with the same value for the checked attribute', async () => {
      fakeFindFirst.mockResolvedValueOnce(null);
      const valueToCheck = 4;

      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: valueToCheck },
            entity: null,
          },
          mockOptions
        )
      );

      await validator(valueToCheck);

      expect(fakeFindFirst).toHaveBeenCalledWith({
        where: {
          locale: 'en',
          publishedAt: null,
          attrIntegerUnique: valueToCheck,
        },
      });
    });

    test('it checks the database for records with the same value but not the same id for the checked attribute if an entity is passed', async () => {
      fakeFindFirst.mockResolvedValueOnce(null);
      const valueToCheck = 5;

      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer', unique: true },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: valueToCheck },
            entity: { id: 1, attrIntegerUnique: 42 },
          },
          mockOptions
        )
      );

      await validator(valueToCheck);

      expect(fakeFindFirst).toHaveBeenCalledWith({
        where: {
          attrIntegerUnique: valueToCheck,
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
    test('it fails the validation if the integer is lower than the define min', async () => {
      expect.assertions(1);

      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer', min: 3 },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: 5 },
            entity: { id: 1, attrIntegerUnique: 42 },
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

    test('it validates the min constraint if the integer is higher than the define min', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer', min: 3 },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: 5 },
            entity: { id: 1, attrIntegerUnique: 42 },
          },
          mockOptions
        )
      );

      expect(await validator(4)).toBe(4);
    });
  });

  describe('max', () => {
    test('it fails the validation if the number is integer than the define max', async () => {
      expect.assertions(1);

      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer', max: 3 },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: 5 },
            entity: { id: 1, attrIntegerUnique: 42 },
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

    test('it validates the max constraint if the integer is lower than the define max', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.integer(
          {
            attr: { type: 'integer', max: 3 },
            model: fakeModel,
            updatedAttribute: { name: 'attrIntegerUnique', value: 5 },
            entity: { id: 1, attrIntegerUnique: 42 },
          },
          mockOptions
        )
      );

      expect(await validator(2)).toBe(2);
    });
  });
});
