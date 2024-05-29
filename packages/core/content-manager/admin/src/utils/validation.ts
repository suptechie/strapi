import { translatedErrors } from '@strapi/admin/strapi-admin';
import pipe from 'lodash/fp/pipe';
import * as yup from 'yup';

import { DOCUMENT_META_FIELDS } from '../constants/attributes';

import type { ComponentsDictionary, Schema } from '../hooks/useDocument';
import type { Schema as SchemaUtils } from '@strapi/types';
import type { ObjectShape } from 'yup/lib/object';

type AnySchema =
  | yup.StringSchema
  | yup.NumberSchema
  | yup.BooleanSchema
  | yup.DateSchema
  | yup.ArraySchema<any>
  | yup.ObjectSchema<any>;

/* -------------------------------------------------------------------------------------------------
 * createYupSchema
 * -----------------------------------------------------------------------------------------------*/

/**
 * TODO: should we create a Map to store these based on the hash of the schema?
 */
const createYupSchema = (
  attributes: Schema['attributes'] = {},
  components: ComponentsDictionary = {}
): yup.ObjectSchema<any> => {
  const createModelSchema = (attributes: Schema['attributes']): yup.ObjectSchema<any> =>
    yup
      .object()
      .shape(
        Object.entries(attributes).reduce<ObjectShape>((acc, [name, attribute]) => {
          if (DOCUMENT_META_FIELDS.includes(name)) {
            return acc;
          }

          /**
           * These validations won't apply to every attribute
           * and that's okay, in that case we just return the
           * schema as it was passed.
           */
          const validations = [
            addRequiredValidation,
            addMinLengthValidation,
            addMaxLengthValidation,
            addMinValidation,
            addMaxValidation,
            addRegexValidation,
          ].map((fn) => fn(attribute));

          const transformSchema = pipe(...validations);

          switch (attribute.type) {
            case 'component': {
              const { attributes } = components[attribute.component];

              if (attribute.repeatable) {
                return {
                  ...acc,
                  [name]: transformSchema(
                    yup.array().of(createModelSchema(attributes).nullable(false))
                  ),
                };
              } else {
                return {
                  ...acc,
                  [name]: transformSchema(createModelSchema(attributes)),
                };
              }
            }
            case 'dynamiczone':
              return {
                ...acc,
                [name]: transformSchema(
                  yup.array().of(
                    yup.lazy(
                      (
                        data: SchemaUtils.Attribute.Value<SchemaUtils.Attribute.DynamicZone>[number]
                      ) => {
                        const attributes = components?.[data?.__component]?.attributes;

                        const validation = yup
                          .object()
                          .shape({
                            __component: yup.string().required().oneOf(Object.keys(components)),
                          })
                          .nullable(false);
                        if (!attributes) {
                          return validation;
                        }

                        return validation.concat(createModelSchema(attributes));
                      }
                    ) as unknown as yup.ObjectSchema<any>
                  )
                ),
              };
            case 'relation':
              return {
                ...acc,
                [name]: transformSchema(
                  yup.lazy((value) => {
                    if (!value) {
                      return yup.mixed().nullable(true);
                    } else if (Array.isArray(value)) {
                      // If a relation value is an array, we expect
                      // an array of objects with {id} properties, representing the related entities.
                      return yup.array().of(
                        yup.object().shape({
                          id: yup.string().required(),
                        })
                      );
                    } else if (typeof value === 'object') {
                      // A realtion value can also be an object. Some API
                      // repsonses return the number of entities in the relation
                      // as { count: x }
                      return yup.object();
                    } else {
                      return yup
                        .mixed()
                        .test(
                          'type-error',
                          'Relation values must be either null, an array of objects with {id} or an object.',
                          () => false
                        );
                    }
                  })
                ),
              };
            default:
              return {
                ...acc,
                [name]: transformSchema(createAttributeSchema(attribute)),
              };
          }
        }, {})
      )
      /**
       * TODO: investigate why an undefined object fails a check of `nullable`.
       */
      .default(null);

  return createModelSchema(attributes);
};

const createAttributeSchema = (
  attribute: Exclude<
    SchemaUtils.Attribute.AnyAttribute,
    { type: 'dynamiczone' } | { type: 'component' } | { type: 'relation' }
  >
) => {
  switch (attribute.type) {
    case 'biginteger':
      return yup.string().matches(/^-?\d*$/);
    case 'boolean':
      return yup.boolean();
    case 'blocks':
      return yup.mixed().test('isBlocks', translatedErrors.json, (value) => {
        if (!value || Array.isArray(value)) {
          return true;
        } else {
          return false;
        }
      });
    case 'decimal':
    case 'float':
    case 'integer':
      return yup.number();
    case 'email':
      return yup.string().email(translatedErrors.email);
    case 'enumeration':
      return yup.string().oneOf([...attribute.enum, null]);
    case 'json':
      return yup.mixed().test('isJSON', translatedErrors.json, (value) => {
        /**
         * We don't want to validate the JSON field if it's empty.
         */
        if (!value || (typeof value === 'string' && value.length === 0)) {
          return true;
        }

        try {
          JSON.parse(value);

          return true;
        } catch (err) {
          return false;
        }
      });
    case 'password':
    case 'richtext':
    case 'string':
    case 'text':
      return yup.string();
    case 'uid':
      return yup.string().matches(/^[A-Za-z0-9-_.~]*$/);
    default:
      /**
       * This allows any value.
       */
      return yup.mixed();
  }
};

/* -------------------------------------------------------------------------------------------------
 * Validators
 * -----------------------------------------------------------------------------------------------*/
/**
 * Our validator functions can be preped with the
 * attribute and then have the schema piped through them.
 */
type ValidationFn = (
  attribute: Schema['attributes'][string]
) => <TSchema extends AnySchema>(schema: TSchema) => TSchema;

const addRequiredValidation: ValidationFn = (attribute) => (schema) => {
  if (attribute.required) {
    return schema.required({
      id: translatedErrors.required.id,
      defaultMessage: 'This field is required.',
    });
  }

  return schema?.nullable
    ? schema.nullable()
    : // In some cases '.nullable' will not be available on the schema.
      // e.g. when the schema has been built using yup.lazy (e.g. for relations).
      // In these cases we should just return the schema as it is.
      schema;
};

const addMinLengthValidation: ValidationFn =
  (attribute) =>
  <TSchema extends AnySchema>(schema: TSchema): TSchema => {
    if (
      'minLength' in attribute &&
      attribute.minLength &&
      Number.isInteger(attribute.minLength) &&
      'min' in schema
    ) {
      return schema.min(attribute.minLength, {
        ...translatedErrors.minLength,
        values: {
          min: attribute.minLength,
        },
      }) as TSchema;
    }

    return schema;
  };

const addMaxLengthValidation: ValidationFn =
  (attribute) =>
  <TSchema extends AnySchema>(schema: TSchema): TSchema => {
    if (
      'maxLength' in attribute &&
      attribute.maxLength &&
      Number.isInteger(attribute.maxLength) &&
      'max' in schema
    ) {
      return schema.max(attribute.maxLength, {
        ...translatedErrors.maxLength,
        values: {
          max: attribute.maxLength,
        },
      }) as TSchema;
    }

    return schema;
  };

const addMinValidation: ValidationFn =
  (attribute) =>
  <TSchema extends AnySchema>(schema: TSchema): TSchema => {
    if ('min' in attribute) {
      const min = toInteger(attribute.min);

      if ('min' in schema && min) {
        return schema.min(min, {
          ...translatedErrors.min,
          values: {
            min,
          },
        }) as TSchema;
      }
    }

    return schema;
  };

const addMaxValidation: ValidationFn =
  (attribute) =>
  <TSchema extends AnySchema>(schema: TSchema): TSchema => {
    if ('max' in attribute) {
      const max = toInteger(attribute.max);

      if ('max' in schema && max) {
        return schema.max(max, {
          ...translatedErrors.max,
          values: {
            max,
          },
        }) as TSchema;
      }
    }

    return schema;
  };

const toInteger = (val?: string | number): number | undefined => {
  if (typeof val === 'number' || val === undefined) {
    return val;
  } else {
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }
};

const addRegexValidation: ValidationFn =
  (attribute) =>
  <TSchema extends AnySchema>(schema: TSchema): TSchema => {
    if ('regex' in attribute && attribute.regex && 'matches' in schema) {
      return schema.matches(new RegExp(attribute.regex), {
        message: {
          id: translatedErrors.regex.id,
          defaultMessage: 'The value does not match the defined pattern.',
        },

        excludeEmptyString: !attribute.required,
      }) as TSchema;
    }

    return schema;
  };

export { createYupSchema };
