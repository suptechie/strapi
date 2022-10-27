/**
 * Entity validator
 * Module that will validate input data for entity creation or edition
 */

'use strict';

const { isEmpty, uniqBy, castArray, isNil } = require('lodash');
const { has, assoc, prop, isObject } = require('lodash/fp');
const strapiUtils = require('@strapi/utils');
const validators = require('./validators');

const { yup, validateYupSchema } = strapiUtils;
const { isMediaAttribute, isScalarAttribute, getWritableAttributes } = strapiUtils.contentTypes;
const { ValidationError } = strapiUtils.errors;

const addMinMax = (validator, { attr, updatedAttribute }) => {
  let nextValidator = validator;

  if (
    Number.isInteger(attr.min) &&
    (attr.required || (Array.isArray(updatedAttribute.value) && updatedAttribute.value.length > 0))
  ) {
    nextValidator = nextValidator.min(attr.min);
  }
  if (Number.isInteger(attr.max)) {
    nextValidator = nextValidator.max(attr.max);
  }
  return nextValidator;
};

const addRequiredValidation = (createOrUpdate) => {
  return (validator, { attr: { required } }) => {
    let nextValidator = validator;
    if (required) {
      if (createOrUpdate === 'creation') {
        nextValidator = nextValidator.notNil();
      } else if (createOrUpdate === 'update') {
        nextValidator = nextValidator.notNull();
      }
    } else {
      nextValidator = nextValidator.nullable();
    }
    return nextValidator;
  };
};

const addDefault = (createOrUpdate) => {
  return (validator, { attr }) => {
    let nextValidator = validator;

    if (createOrUpdate === 'creation') {
      if (
        ((attr.type === 'component' && attr.repeatable) || attr.type === 'dynamiczone') &&
        !attr.required
      ) {
        nextValidator = nextValidator.default([]);
      } else {
        nextValidator = nextValidator.default(attr.default);
      }
    } else {
      nextValidator = nextValidator.default(undefined);
    }

    return nextValidator;
  };
};

const preventCast = (validator) => validator.transform((val, originalVal) => originalVal);

const createComponentValidator =
  (createOrUpdate) =>
  ({ attr, updatedAttribute }, { isDraft }) => {
    let validator;

    const model = strapi.getModel(attr.component);
    if (!model) {
      throw new Error('Validation failed: Model not found');
    }

    if (prop('repeatable', attr) === true) {
      validator = yup
        .array()
        .of(
          yup.lazy((item) =>
            createModelValidator(createOrUpdate)({ model, data: item }, { isDraft }).notNull()
          )
        );
      validator = addRequiredValidation(createOrUpdate)(validator, { attr: { required: true } });
      validator = addMinMax(validator, { attr, updatedAttribute });
    } else {
      validator = createModelValidator(createOrUpdate)({ model, updatedAttribute }, { isDraft });
      validator = addRequiredValidation(createOrUpdate)(validator, {
        attr: { required: !isDraft && attr.required },
      });
    }

    return validator;
  };

const createDzValidator =
  (createOrUpdate) =>
  ({ attr, updatedAttribute }, { isDraft }) => {
    let validator;

    validator = yup.array().of(
      yup.lazy((item) => {
        const model = strapi.getModel(prop('__component', item));
        const schema = yup
          .object()
          .shape({
            __component: yup.string().required().oneOf(Object.keys(strapi.components)),
          })
          .notNull();

        return model
          ? schema.concat(createModelValidator(createOrUpdate)({ model, data: item }, { isDraft }))
          : schema;
      })
    );
    validator = addRequiredValidation(createOrUpdate)(validator, { attr: { required: true } });
    validator = addMinMax(validator, { attr, updatedAttribute });

    return validator;
  };

const createRelationValidator =
  (createOrUpdate) =>
  ({ attr, updatedAttribute }, { isDraft }) => {
    let validator;

    if (Array.isArray(updatedAttribute.value)) {
      validator = yup.array().of(yup.mixed());
    } else {
      validator = yup.mixed();
    }

    validator = addRequiredValidation(createOrUpdate)(validator, {
      attr: { required: !isDraft && attr.required },
    });

    return validator;
  };

const createScalarAttributeValidator = (createOrUpdate) => (metas, options) => {
  let validator;

  if (has(metas.attr.type, validators)) {
    validator = validators[metas.attr.type](metas, options);
  } else {
    // No validators specified - fall back to mixed
    validator = yup.mixed();
  }

  validator = addRequiredValidation(createOrUpdate)(validator, {
    attr: { required: !options.isDraft && metas.attr.required },
  });

  return validator;
};

const createAttributeValidator = (createOrUpdate) => (metas, options) => {
  let validator;

  if (isMediaAttribute(metas.attr)) {
    validator = yup.mixed();
  } else if (isScalarAttribute(metas.attr)) {
    validator = createScalarAttributeValidator(createOrUpdate)(metas, options);
  } else {
    if (metas.attr.type === 'component') {
      validator = createComponentValidator(createOrUpdate)(metas, options);
    } else if (metas.attr.type === 'dynamiczone') {
      validator = createDzValidator(createOrUpdate)(metas, options);
    } else {
      validator = createRelationValidator(createOrUpdate)(metas, options);
    }

    validator = preventCast(validator);
  }

  validator = addDefault(createOrUpdate)(validator, metas);

  return validator;
};

const createModelValidator =
  (createOrUpdate) =>
  ({ model, data, entity }, options) => {
    const writableAttributes = model ? getWritableAttributes(model) : [];

    const schema = writableAttributes.reduce((validators, attributeName) => {
      const validator = createAttributeValidator(createOrUpdate)(
        {
          attr: model.attributes[attributeName],
          updatedAttribute: { name: attributeName, value: prop(attributeName, data) },
          model,
          entity,
        },
        options
      );

      return assoc(attributeName, validator)(validators);
    }, {});

    return yup.object().shape(schema);
  };

const createValidateEntity =
  (createOrUpdate) =>
  async (model, data, { isDraft = false } = {}, entity = null) => {
    if (!isObject(data)) {
      const { displayName } = model.info;

      throw new ValidationError(
        `Invalid payload submitted for the ${createOrUpdate} of an entity of type ${displayName}. Expected an object, but got ${typeof data}`
      );
    }

    const validator = createModelValidator(createOrUpdate)(
      {
        model,
        data,
        entity,
      },
      { isDraft }
    )
      .test('relations-test', 'check that all relations exist', async function (data) {
        try {
          await checkRelationsExist(buildRelationsStore(model.uid, data) || {});
        } catch (e) {
          return this.createError({
            path: this.path,
            message: e.message,
          });
        }
        return true;
      })
      .required();

    return validateYupSchema(validator, { strict: false, abortEarly: false })(data);
  };

/**
 * Builds an object containing all the media and relations being associated with an entity
 * @param {String} uid of the model
 * @param {Object} data
 * @param {Object} relationsStore to be updated and returned
 * @returns
 */
const buildRelationsStore = (uid, data, relationsStore = {}) => {
  const currentModel = strapi.getModel(uid);

  Object.keys(currentModel?.attributes || {}).forEach((attributeName) => {
    const attribute = currentModel.attributes[attributeName];

    const value = data[attributeName];
    if (isEmpty(value) || isNil(value)) {
      return;
    }

    switch (attribute.type) {
      case 'relation': {
        if (!attribute.target) {
          return;
        }
        // If the attribute type is a relation keep track of all
        // associations being made with relations.
        let directValue = [];
        if (Array.isArray(value)) {
          directValue = value.map((v) => ({ id: v }));
        }
        relationsStore[attribute.target] = relationsStore[attribute.target] || [];
        relationsStore[attribute.target].push(...(value.connect || value.set || directValue));
        break;
      }
      case 'media': {
        // For media attribute types keep track of all media associated with
        // this entity.
        const mediaUID = 'plugin::upload.file';
        castArray(value).forEach((v) => {
          relationsStore[mediaUID] = relationsStore[mediaUID] || [];
          relationsStore[mediaUID].push({ id: v.id || v });
        });
        break;
      }
      case 'component': {
        return castArray(value).forEach((componentValue) =>
          buildRelationsStore(attribute.component, componentValue, relationsStore)
        );
      }
      case 'dynamiczone': {
        return value.forEach((dzValue) =>
          buildRelationsStore(dzValue.__component, dzValue, relationsStore)
        );
      }
      default:
        break;
    }
  });

  return relationsStore;
};

/**
 * Iterate through the relations store and validates that every relation or media
 * mentioned exists
 */
const checkRelationsExist = async (relationsStore = {}) => {
  const promises = [];

  for (const [key, value] of Object.entries(relationsStore)) {
    const evaluate = async () => {
      const uniqueValues = uniqBy(value, `id`);
      // eslint-disable-next-line no-unused-vars
      const count = await strapi.db.query(key).count({
        where: {
          id: {
            $in: uniqueValues.map((v) => Number(v.id)),
          },
        },
      });

      if (count !== uniqueValues.length) {
        throw new ValidationError(
          `${
            uniqueValues.length - count
          } relation(s) of type ${key} associated with this entity do not exist`
        );
      }
    };
    promises.push(evaluate());
  }

  return Promise.all(promises);
};

module.exports = {
  validateEntityCreation: createValidateEntity('creation'),
  validateEntityUpdate: createValidateEntity('update'),
};
