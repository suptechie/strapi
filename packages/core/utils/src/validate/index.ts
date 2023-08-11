import { CurriedFunction1 } from 'lodash';
import { isArray } from 'lodash/fp';

import { getNonWritableAttributes } from '../content-types';
import { pipeAsync } from '../async';

import * as visitors from './visitors';
import * as validators from './validators';
import traverseEntity, { Data } from '../traverse-entity';

import {
  traverseQueryFilters,
  traverseQuerySort,
  traverseQueryPopulate,
} from '../traverse/traversals';

import { Model } from '../types';

export interface Options {
  auth?: unknown;
}

interface Validator {
  (schema: Model): CurriedFunction1<Data, Promise<Data>>;
}
export interface ValidateFunc {
  (data: unknown, schema: Model, options?: Options): Promise<void>;
}

const createContentAPIValidators = () => {
  const validateInput: ValidateFunc = async (data: unknown, schema: Model, { auth } = {}) => {
    if (isArray(data)) {
      await Promise.all(data.map((entry) => validateInput(entry, schema, { auth })));
      return;
    }

    const nonWritableAttributes = getNonWritableAttributes(schema);

    const transforms = [
      // Remove non writable attributes
      traverseEntity(visitors.throwRestrictedFields(nonWritableAttributes), { schema }),
    ];

    if (auth) {
      // Remove restricted relations
      transforms.push(traverseEntity(visitors.throwRestrictedRelations(auth), { schema }));
    }

    // Apply validators from registry if exists
    strapi.validators
      .get('content-api.input')
      .forEach((validator: Validator) => transforms.push(validator(schema)));

    pipeAsync(...transforms)(data as Data);
  };

  const validateQuery = async (
    query: Record<string, unknown>,
    schema: Model,
    { auth }: Options = {}
  ) => {
    const { filters, sort, fields } = query;

    if (filters) {
      await validateFilters(filters, schema, { auth });
    }

    if (sort) {
      await validateSort(sort, schema, { auth });
    }

    if (fields) {
      await validateFields(fields, schema);
    }

    // TODO: validate populate
  };

  const validateFilters: ValidateFunc = async (filters, schema: Model, { auth } = {}) => {
    if (isArray(filters)) {
      await Promise.all(filters.map((filter) => validateFilters(filter, schema, { auth })));
      return;
    }

    const transforms = [validators.defaultSanitizeFilters(schema)];

    if (auth) {
      transforms.push(traverseQueryFilters(visitors.throwRestrictedRelations(auth), { schema }));
    }

    return pipeAsync(...transforms)(filters);
  };

  const validateSort: ValidateFunc = async (sort, schema: Model, { auth } = {}) => {
    const transforms = [validators.defaultSanitizeSort(schema)];

    if (auth) {
      transforms.push(traverseQuerySort(visitors.throwRestrictedRelations(auth), { schema }));
    }

    return pipeAsync(...transforms)(sort);
  };

  const validateFields: ValidateFunc = (fields, schema: Model) => {
    const transforms = [validators.defaultSanitizeFields(schema)];

    return pipeAsync(...transforms)(fields);
  };

  const validatePopulate: ValidateFunc = async (populate, schema: Model, { auth } = {}) => {
    const transforms = [validators.defaultSanitizePopulate(schema)];

    if (auth) {
      transforms.push(traverseQueryPopulate(visitors.throwRestrictedRelations(auth), { schema }));
    }

    return pipeAsync(...transforms)(populate);
  };

  return {
    input: validateInput,
    query: validateQuery,
    filters: validateFilters,
    sort: validateSort,
    fields: validateFields,
    populate: validatePopulate,
  };
};

const contentAPI = createContentAPIValidators();

export default {
  contentAPI,
  validators,
  visitors,
};
