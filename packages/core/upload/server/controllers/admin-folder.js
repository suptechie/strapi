'use strict';

const { setCreatorFields, pipeAsync } = require('@strapi/utils');
const { ApplicationError } = require('@strapi/utils').errors;
const { getService } = require('../utils');
const { validateCreateFolder } = require('./validation/folder');

const folderModel = 'plugin::upload.folder';

module.exports = {
  async find(ctx) {
    const permissionsManager = strapi.admin.services.permission.createPermissionsManager({
      ability: ctx.state.userAbility,
      model: folderModel,
    });

    const { results, pagination } = await strapi.entityService.findWithRelationCounts(folderModel, {
      ...ctx.query,
      populate: {
        children: {
          count: true,
        },
        files: {
          count: true,
        },
        parent: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    ctx.body = {
      results: await permissionsManager.sanitizeOutput(results),
      pagination,
    };
  },
  async create(ctx) {
    const { user } = ctx.state;
    const { body, query } = ctx.request;

    await validateCreateFolder(body);

    const existingFolders = await strapi.entityService.findMany(folderModel, {
      filters: {
        parent: body.parent || null,
        name: body.name,
      },
    });
    if (existingFolders.length > 0) {
      throw new ApplicationError('name already taken');
    }

    const { setPathAndUID } = getService('folder');

    // TODO: wrap with a transaction
    const enrichFolder = pipeAsync(setPathAndUID, setCreatorFields({ user }));
    const enrichedFolder = await enrichFolder(body);

    const folder = await strapi.entityService.create(folderModel, {
      ...query,
      data: enrichedFolder,
    });

    const permissionsManager = strapi.admin.services.permission.createPermissionsManager({
      ability: ctx.state.userAbility,
      model: folderModel,
    });

    ctx.body = {
      data: await permissionsManager.sanitizeOutput(folder),
    };
  },
};
