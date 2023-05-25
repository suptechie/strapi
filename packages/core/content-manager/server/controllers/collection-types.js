'use strict';

const { setCreatorFields, pipeAsync } = require('@strapi/utils');

const { getService, pickWritableAttributes } = require('../utils');
const { validateBulkDeleteInput } = require('./validation');
const { populateBuilder } = require('../services/utils/populate/builder');

module.exports = {
  async find(ctx) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const { query } = ctx.request;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.read()) {
      return ctx.forbidden();
    }

    const permissionQuery = await permissionChecker.sanitizedQuery.read(query);

    const populate = await populateBuilder(model)
      .populateDeep(1)
      .countRelations({ toMany: true, toOne: false })
      .build();

    const { results, pagination } = await entityManager.findPage(
      { ...permissionQuery, populate },
      model
    );

    const sanitizedResults = await Promise.all(
      results.map((result) => permissionChecker.sanitizeOutput(result))
    );

    ctx.body = {
      results: sanitizedResults,
      pagination,
    };
  },

  async findOne(ctx) {
    const { userAbility } = ctx.state;
    const { model, id } = ctx.params;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.read()) {
      return ctx.forbidden();
    }

    const populate = await populateBuilder(model)
      .populateRequiredPermissions(permissionChecker, ctx.query)
      .populateDeep(Infinity)
      .countRelations({ toMany: true, toOne: true })
      .build();

    const entity = await entityManager.findOne(id, model, { populate });

    if (!entity) {
      return ctx.notFound();
    }

    // if the user has condition that needs populated content, it's not applied because entity don't have relations populated
    if (permissionChecker.cannot.read(entity)) {
      return ctx.forbidden();
    }

    // TODO: Move the transform relations to count here.

    ctx.body = await permissionChecker.sanitizeOutput(entity);
  },

  async create(ctx) {
    const { userAbility, user } = ctx.state;
    const { model } = ctx.params;
    const { body } = ctx.request;

    const totalEntries = await strapi.query(model).count();

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.create()) {
      return ctx.forbidden();
    }

    const pickWritables = pickWritableAttributes({ model });
    const pickPermittedFields = permissionChecker.sanitizeCreateInput;
    const setCreator = setCreatorFields({ user });

    const sanitizeFn = pipeAsync(pickWritables, pickPermittedFields, setCreator);

    const sanitizedBody = await sanitizeFn(body);

    const populate = await populateBuilder(model)
      .populateDeep(Infinity)
      // TODO: Use config to know if we need to count relations or not
      .countRelations({ toMany: true, toOne: true })
      .build();

    const entity = await entityManager.create(sanitizedBody, model, { populate });

    ctx.body = await permissionChecker.sanitizeOutput(entity);

    if (totalEntries === 0) {
      strapi.telemetry.send('didCreateFirstContentTypeEntry', {
        eventProperties: { model },
      });
    }
  },

  async update(ctx) {
    const { userAbility, user } = ctx.state;
    const { id, model } = ctx.params;
    const { body } = ctx.request;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.update()) {
      return ctx.forbidden();
    }

    const populate = await populateBuilder(model)
      .populateRequiredPermissions(permissionChecker, ctx.query)
      .build();

    const entity = await entityManager.findOne(id, model, { populate });

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.update(entity)) {
      return ctx.forbidden();
    }

    const pickWritables = pickWritableAttributes({ model });
    const pickPermittedFields = permissionChecker.sanitizeUpdateInput(entity);
    const setCreator = setCreatorFields({ user, isEdition: true });
    const sanitizeFn = pipeAsync(pickWritables, pickPermittedFields, setCreator);
    const sanitizedBody = await sanitizeFn(body);

    const populateUpdate = await populateBuilder(model)
      .populateDeep(Infinity)
      // TODO: Use config to know if we need to count relations or not
      .countRelations({ toMany: true, toOne: true })
      .build();

    const updatedEntity = await entityManager.update(entity, sanitizedBody, model, {
      populate: populateUpdate,
    });

    ctx.body = await permissionChecker.sanitizeOutput(updatedEntity);
  },

  async delete(ctx) {
    const { userAbility } = ctx.state;
    const { id, model } = ctx.params;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.delete()) {
      return ctx.forbidden();
    }

    const populate = await populateBuilder(model)
      .populateRequiredPermissions(permissionChecker, ctx.query)
      .build();

    const entity = await entityManager.findOne(id, model, { populate });

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.delete(entity)) {
      return ctx.forbidden();
    }

    const populateDelete = await populateBuilder(model)
      .populateDeep(Infinity)
      // TODO: Use config to know if we need to count relations or not
      .countRelations({ toMany: true, toOne: true })
      .build();

    const result = await entityManager.delete(entity, model, { populate: populateDelete });

    // TODO: Count if config was enabled or populate based on permissions is not empty

    ctx.body = await permissionChecker.sanitizeOutput(result);
  },

  async publish(ctx) {
    const { userAbility, user } = ctx.state;
    const { id, model } = ctx.params;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.publish()) {
      return ctx.forbidden();
    }

    const populate = await populateBuilder(model)
      .populateRequiredPermissions(permissionChecker, ctx.query)
      .build();

    const entity = await entityManager.findOne(id, model, { populate });

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.publish(entity)) {
      return ctx.forbidden();
    }

    const populatePublish = await populateBuilder(model)
      .populateDeep(Infinity)
      .countRelations({ toMany: true, toOne: true })
      .build();

    const result = await entityManager.publish(
      entity,
      setCreatorFields({ user, isEdition: true })({}),
      model,
      { populate: populatePublish }
    );

    ctx.body = await permissionChecker.sanitizeOutput(result);
  },

  async unpublish(ctx) {
    const { userAbility, user } = ctx.state;
    const { id, model } = ctx.params;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.unpublish()) {
      return ctx.forbidden();
    }

    const populate = await populateBuilder(model)
      .populateRequiredPermissions(permissionChecker, ctx.query)
      .build();

    const entity = await entityManager.findOne(id, model, { populate });

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.unpublish(entity)) {
      return ctx.forbidden();
    }

    const populateUnpublish = await populateBuilder(model)
      .populateDeep(Infinity)
      .countRelations({ toMany: true, toOne: true })
      .build();

    const result = await entityManager.unpublish(
      entity,
      setCreatorFields({ user, isEdition: true })({}),
      model,
      { populate: populateUnpublish }
    );

    ctx.body = await permissionChecker.sanitizeOutput(result);
  },

  async bulkDelete(ctx) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const { query, body } = ctx.request;
    const { ids } = body;

    await validateBulkDeleteInput(body);

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.delete()) {
      return ctx.forbidden();
    }

    // TODO: fix
    const permissionQuery = await permissionChecker.sanitizedQuery.delete(query);

    const idsWhereClause = { id: { $in: ids } };
    const params = {
      ...permissionQuery,
      filters: {
        $and: [idsWhereClause].concat(permissionQuery.filters || []),
      },
    };

    const { count } = await entityManager.deleteMany(params, model);

    ctx.body = { count };
  },

  async getNumberOfDraftRelations(ctx) {
    const { userAbility } = ctx.state;
    const { model, id } = ctx.params;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.read()) {
      return ctx.forbidden();
    }

    const populate = await populateBuilder(model)
      .populateRequiredPermissions(permissionChecker, ctx.query)
      .build();

    const entity = await entityManager.findOne(id, model, { populate });

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.read(entity)) {
      return ctx.forbidden();
    }

    const number = await entityManager.getNumberOfDraftRelations(id, model);

    return {
      data: number,
    };
  },
};
