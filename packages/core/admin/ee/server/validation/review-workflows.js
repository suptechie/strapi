'use strict';

const { yup, validateYupSchema } = require('@strapi/utils');
const { getVisibleContentTypesUID } = require('../utils/review-workflows');

const stageObject = yup.object().shape({
  id: yup.number().integer().min(1),
  name: yup.string().max(255).required(),
  color: yup.string().matches(/^#(?:[0-9a-fA-F]{3}){1,2}$/i), // hex color
});

const validateUpdateStageOnEntity = yup
  .object()
  .shape({
    id: yup.number().integer().min(1).required(),
  })
  .required();

const validateContentTypes = yup.array().of(
  yup
    .string()
    .test({
      name: 'content-type-exists',
      message: (value) => `Content type ${value.originalValue} does not exist`,
      test(uid) {
        // Warning; we use the strapi global - to avoid that, it would need to refactor how
        // we generate validation function by using a factory with the strapi instance as parameter.
        return strapi.getModel(uid);
      },
    })
    .test({
      name: 'content-type-review-workflow-enabled',
      message: (value) =>
        `Content type ${value.originalValue} does not have review workflow enabled`,
      test(uid) {
        // It's not a valid  content type if it's not visible in the content manager
        return getVisibleContentTypesUID({ [uid]: strapi.getModel(uid) }).includes(uid);
      },
    })
);

const validateWorkflowCreateSchema = yup.object().shape({
  name: yup.string().max(255).required(),
  stages: yup
    .array()
    .of(stageObject)
    .min(1, 'Can not create a workflow without stages')
    .max(200, 'Can not have more than 200 stages')
    .required('Can not create a workflow without stages'),
  contentTypes: validateContentTypes,
});

const validateWorkflowUpdateSchema = yup.object().shape({
  name: yup.string().max(255),
  stages: yup
    .array()
    .of(stageObject)
    .min(1, 'Can not update a workflow without stages')
    .max(200, 'Can not have more than 200 stages'),
  contentTypes: validateContentTypes,
});

module.exports = {
  validateWorkflowCreate: validateYupSchema(validateWorkflowCreateSchema),
  validateUpdateStageOnEntity: validateYupSchema(validateUpdateStageOnEntity),
  validateWorkflowUpdate: validateYupSchema(validateWorkflowUpdateSchema),
};
