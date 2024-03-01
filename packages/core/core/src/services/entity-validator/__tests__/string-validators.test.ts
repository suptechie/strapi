import strapiUtils, { errors } from '@strapi/utils';
import type { Schema } from '@strapi/types';
import validators from '../validators';
import { mockOptions } from './utils';

describe('String validator', () => {
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
      attrStringUnique: { type: 'string', unique: true },
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
        validators.string(
          {
            attr: { type: 'string' },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'non-unique-test-data',
            },
            entity: null,
          },
          mockOptions
        )
      );

      await validator('non-unique-test-data');

      expect(fakeFindFirst).not.toHaveBeenCalled();
    });

    test('it does not validates the unique constraint if the attribute value is `null`', async () => {
      fakeFindFirst.mockResolvedValueOnce(null);

      const validator = strapiUtils.validateYupSchema(
        validators
          .string(
            {
              attr: { type: 'string', unique: true },
              model: fakeModel,
              updatedAttribute: {
                name: 'attrStringUnique',
                value: null,
              },
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
        validators.string(
          {
            attr: { type: 'string', unique: true },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'non-unique-test-data',
            },
            entity: null,
          },
          mockOptions
        )
      );

      expect(await validator('non-unique-test-data')).toBe('non-unique-test-data');
    });

    test('it fails the validation of the unique constraint if the database contains a record with the same attribute value', async () => {
      expect.assertions(1);
      fakeFindFirst.mockResolvedValueOnce({ attrStringUnique: 'unique-test-data' });

      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', unique: true },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'unique-test-data',
            },
            entity: null,
          },
          mockOptions
        )
      );

      try {
        await validator('unique-test-data');
      } catch (err) {
        expect(err).toBeInstanceOf(errors.YupValidationError);
      }
    });

    test('it validates the unique constraint if the attribute data has not changed even if there is a record in the database with the same attribute value', async () => {
      fakeFindFirst.mockResolvedValueOnce({ attrStringUnique: 'non-updated-unique-test-data' });

      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', unique: true },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'non-updated-unique-test-data',
            },
            entity: { id: 1, attrStringUnique: 'non-updated-unique-test-data' },
          },
          mockOptions
        )
      );

      expect(await validator('non-updated-unique-test-data')).toBe('non-updated-unique-test-data');
    });

    test('it checks the database for records with the same value for the checked attribute', async () => {
      fakeFindFirst.mockResolvedValueOnce(null);

      const valueToCheck = 'test-data';
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', unique: true },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: valueToCheck,
            },
            entity: null,
          },
          mockOptions
        )
      );

      await validator(valueToCheck);

      expect(fakeFindFirst).toHaveBeenCalledWith({
        where: {
          locale: 'en',
          attrStringUnique: valueToCheck,
          publishedAt: null,
        },
      });
    });

    test('it checks the database for records with the same value but not the same id for the checked attribute if an entity is passed', async () => {
      fakeFindFirst.mockResolvedValueOnce(null);

      const valueToCheck = 'test-data';
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', unique: true },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: valueToCheck,
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      await validator(valueToCheck);

      expect(fakeFindFirst).toHaveBeenCalledWith({
        where: {
          attrStringUnique: valueToCheck,
          id: {
            $ne: 1,
          },
          locale: 'en',
          publishedAt: null,
        },
      });
    });
  });

  describe('minLength', () => {
    test('it does not validates the minLength constraint if it is a draft', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', minLength: 3 },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      expect(await validator('a')).toBe('a');
    });

    test('it fails the validation if the string is shorter than the define minLength', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', minLength: 3 },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      try {
        await validator('a');
      } catch (err) {
        expect(err).toBeInstanceOf(errors.YupValidationError);
      }
    });

    test('it validates the minLength constraint if the string is longer than the define minLength', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', minLength: 3 },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      expect(await validator('this string is longer than the minLenght')).toBe(
        'this string is longer than the minLenght'
      );
    });
  });

  describe('maxLength', () => {
    test('it does not validates the maxLength constraint if the attribute maxLength is not an integer', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', maxLength: 123 },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      expect(await validator('a')).toBe('a');
    });

    test('it fails the validation if the string is longer than the define maxLength', async () => {
      expect.assertions(1);

      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', maxLength: 3 },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      try {
        await validator('this string is too long');
      } catch (err) {
        expect(err).toBeInstanceOf(errors.YupValidationError);
      }
    });

    test('it validates the maxLength constraint if the string is shorter than the define maxLength', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', maxLength: 3 },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      expect(await validator('a')).toBe('a');
    });
  });

  describe('regExp', () => {
    test('it fails the validation of an empty string for a required field', async () => {
      expect.assertions(1);

      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', required: true, regex: /^\w+$/ },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      try {
        await validator('');
      } catch (err) {
        expect(err).toBeInstanceOf(errors.YupValidationError);
      }
    });

    test('it validates a string for required field according to the regex constraint', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', required: true, regex: /^\w+$/ },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      expect(await validator('Strapi')).toBe('Strapi');
    });

    test('it validates an empty string for non-required field with a regex constraint', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', required: false, regex: /^\w+$/ },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      expect(await validator('')).toBe('');
    });

    test('it validates a string for non-required field according to the regex constraint', async () => {
      const validator = strapiUtils.validateYupSchema(
        validators.string(
          {
            attr: { type: 'string', required: false, regex: /^\w+$/ },
            model: fakeModel,
            updatedAttribute: {
              name: 'attrStringUnique',
              value: 'test-data',
            },
            entity: { id: 1, attrStringUnique: 'other-data' },
          },
          mockOptions
        )
      );

      expect(await validator('Strapi')).toBe('Strapi');
    });
  });
});
