import { curry, isEmpty, isNil } from 'lodash/fp';

import { pipeAsync } from '../async';
import traverseEntity from '../traverse-entity';
import { isScalarAttribute, constants } from '../content-types';
import {
  traverseQueryFilters,
  traverseQuerySort,
  traverseQueryFields,
  traverseQueryPopulate,
} from '../traverse';
import { throwPassword, throwPrivate, throwDynamicZones, throwMorphToRelations } from './visitors';
import { isOperator } from '../operators';
import { throwInvalidParam } from './utils';
import type { Model, Data } from '../types';

const { ID_ATTRIBUTE, DOC_ID_ATTRIBUTE } = constants;

const throwPasswords = (schema: Model) => async (entity: Data) => {
  if (!schema) {
    throw new Error('Missing schema in throwPasswords');
  }

  return traverseEntity(throwPassword, { schema }, entity);
};

const defaultValidateFilters = curry((schema: Model, filters: unknown) => {
  // TODO: schema checks should check that it is a validate schema with yup
  if (!schema) {
    throw new Error('Missing schema in defaultValidateFilters');
  }
  return pipeAsync(
    // keys that are not attributes or valid operators
    traverseQueryFilters(
      ({ key, attribute, path }) => {
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not removing it
        if ([ID_ATTRIBUTE, DOC_ID_ATTRIBUTE].includes(key)) {
          return;
        }

        const isAttribute = !!attribute;

        if (!isAttribute && !isOperator(key)) {
          throwInvalidParam({ key, path: path.attribute });
        }
      },
      { schema }
    ),
    // dynamic zones from filters
    traverseQueryFilters(throwDynamicZones, { schema }),
    // morphTo relations from filters; because you can't have deep filtering on morph relations
    traverseQueryFilters(throwMorphToRelations, { schema }),
    // passwords from filters
    traverseQueryFilters(throwPassword, { schema }),
    // private from filters
    traverseQueryFilters(throwPrivate, { schema })
    // we allow empty objects to validate and only sanitize them out, so that users may write "lazy" queries without checking their params exist
  )(filters);
});

const defaultValidateSort = curry((schema: Model, sort: unknown) => {
  if (!schema) {
    throw new Error('Missing schema in defaultValidateSort');
  }

  return pipeAsync(
    // non attribute keys
    traverseQuerySort(
      ({ key, attribute, path }) => {
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not removing it
        if ([ID_ATTRIBUTE, DOC_ID_ATTRIBUTE].includes(key)) {
          return;
        }

        if (!attribute) {
          throwInvalidParam({ key, path: path.attribute });
        }
      },
      { schema }
    ),
    // dynamic zones from sort
    traverseQuerySort(throwDynamicZones, { schema }),
    // morphTo relations from sort
    traverseQuerySort(throwMorphToRelations, { schema }),
    // private from sort
    traverseQuerySort(throwPrivate, { schema }),
    // passwords from filters
    traverseQuerySort(throwPassword, { schema }),
    // keys for empty non-scalar values
    traverseQuerySort(
      ({ key, attribute, value, path }) => {
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not removing it
        if ([ID_ATTRIBUTE, DOC_ID_ATTRIBUTE].includes(key)) {
          return;
        }

        if (!isScalarAttribute(attribute) && isEmpty(value)) {
          throwInvalidParam({ key, path: path.attribute });
        }
      },
      { schema }
    )
  )(sort);
});

const defaultValidateFields = curry((schema: Model, fields: unknown) => {
  if (!schema) {
    throw new Error('Missing schema in defaultValidateFields');
  }
  return pipeAsync(
    // Only allow scalar attributes
    traverseQueryFields(
      ({ key, attribute, path }) => {
        // ID is not an attribute per se, so we need to make
        // an extra check to ensure we're not removing it
        if ([ID_ATTRIBUTE, DOC_ID_ATTRIBUTE].includes(key)) {
          return;
        }

        if (isNil(attribute) || !isScalarAttribute(attribute)) {
          throwInvalidParam({ key, path: path.attribute });
        }
      },
      { schema }
    ),
    // private fields
    traverseQueryFields(throwPrivate, { schema }),
    // password fields
    traverseQueryFields(throwPassword, { schema })
  )(fields);
});

const defaultValidatePopulate = curry((schema: Model, populate: unknown) => {
  if (!schema) {
    throw new Error('Missing schema in defaultValidatePopulate');
  }

  return pipeAsync(
    traverseQueryPopulate(
      async ({ key, value, schema, attribute }, { set }) => {
        if (attribute) {
          return;
        }

        if (key === 'sort') {
          set(key, await defaultValidateSort(schema, value));
        }

        if (key === 'filters') {
          set(key, await defaultValidateFilters(schema, value));
        }

        if (key === 'fields') {
          set(key, await defaultValidateFields(schema, value));
        }

        if (key === 'populate') {
          set(key, await defaultValidatePopulate(schema, value));
        }
      },
      { schema }
    ),
    // Remove private fields
    traverseQueryPopulate(throwPrivate, { schema })
  )(populate);
});
export {
  throwPasswords,
  defaultValidateFilters,
  defaultValidateSort,
  defaultValidateFields,
  defaultValidatePopulate,
};
