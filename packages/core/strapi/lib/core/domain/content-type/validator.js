'use strict';

const { keyBy, mapValues } = require('lodash');
const { yup } = require('@strapi/utils');

// To replace by directly using implemented lifecycles
const lifecycles = ['beforeCreate', 'afterCreate'];
const lifecyclesShape = mapValues(keyBy(lifecycles), () =>
  yup
    .mixed()
    .nullable()
    .isFunction()
);

const contentTypeSchemaValidator = yup.object().shape({
  schema: yup.object().shape({
    info: yup
      .object()
      .shape({
        displayName: yup.string().required(),
        singularName: yup
          .string()
          .isKebabCase()
          .required(),
        pluralName: yup
          .string()
          .isKebabCase()
          .required(),
      })
      .required(),
  }),
  actions: yup.object().onlyContainsFunctions(),
  lifecycles: yup
    .object()
    .shape(lifecyclesShape)
    .noUnknown(),
});

const validateContentTypeDefinition = data => {
  return contentTypeSchemaValidator.validateSync(data, { strict: true, abortEarly: false });
};

module.exports = {
  validateContentTypeDefinition,
};
