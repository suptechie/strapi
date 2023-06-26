'use strict';

const { mapAsync } = require('@strapi/utils');
const { getService } = require('../../utils');

const {
  validateWorkflowCreate,
  validateWorkflowUpdate,
} = require('../../validation/review-workflows');
const { WORKFLOW_MODEL_UID } = require('../../constants/workflows');

/**
 *
 * @param { Strapi } strapi - Strapi instance
 * @param userAbility
 * @return { PermissionChecker }
 */
function getWorkflowsPermissionChecker({ strapi }, userAbility) {
  return strapi
    .plugin('content-manager')
    .service('permission-checker')
    .create({ userAbility, model: WORKFLOW_MODEL_UID });
}

module.exports = {
  /**
   * Create a new workflow
   * @param {import('koa').BaseContext} ctx - koa context
   */
  async create(ctx) {
    const { body } = ctx.request;
    const { populate } = ctx.query;
    const { sanitizeCreateInput, sanitizeOutput } = getWorkflowsPermissionChecker(
      { strapi },
      ctx.state.userAbility
    );

    const workflowBody = await validateWorkflowCreate(body.data);

    const workflowService = getService('workflows');
    const createdWorkflow = await workflowService.create({
      data: await sanitizeCreateInput(workflowBody),
      populate,
    });

    ctx.body = {
      data: await sanitizeOutput(createdWorkflow),
    };
  },

  /**
   * Update a workflow
   * @param {import('koa').BaseContext} ctx - koa context
   */
  async update(ctx) {
    const { id } = ctx.params;
    const { body } = ctx.request;
    const { populate } = ctx.query;
    const workflowService = getService('workflows');
    const { sanitizeUpdateInput, sanitizeOutput } = getWorkflowsPermissionChecker(
      { strapi },
      ctx.state.userAbility
    );

    const workflowBody = await validateWorkflowUpdate(body.data);

    const workflow = await workflowService.findById(id, { populate: ['stages'] });
    if (!workflow) {
      return ctx.notFound();
    }

    const updatedWorkflow = await workflowService.update(workflow, {
      data: await sanitizeUpdateInput(workflowBody),
      populate,
    });

    ctx.body = {
      data: await sanitizeOutput(updatedWorkflow),
    };
  },

  /**
   * Delete a workflow
   * @param {import('koa').BaseContext} ctx - koa context
   */
  async delete(ctx) {
    const { id } = ctx.params;
    const { populate } = ctx.query;
    const workflowService = getService('workflows');
    const { sanitizeOutput } = getWorkflowsPermissionChecker({ strapi }, ctx.state.userAbility);

    const workflow = await workflowService.findById(id, { populate: ['stages'] });
    if (!workflow) {
      return ctx.notFound("Workflow doesn't exist");
    }

    const deletedWorkflow = await workflowService.delete(workflow, { populate });

    ctx.body = {
      data: await sanitizeOutput(deletedWorkflow),
    };
  },

  /**
   * List all workflows
   * @param {import('koa').BaseContext} ctx - koa context
   */
  async find(ctx) {
    const { populate, filters, sort } = ctx.query;
    const workflowService = getService('workflows');
    const { sanitizeOutput } = getWorkflowsPermissionChecker({ strapi }, ctx.state.userAbility);

    const workflows = await workflowService.find({
      populate,
      filters,
      sort,
    });

    ctx.body = {
      data: await mapAsync(workflows, sanitizeOutput),
    };
  },
  /**
   * Get one workflow based on its id contained in request parameters
   * @param {import('koa').BaseContext} ctx - koa context
   */
  async findById(ctx) {
    const { id } = ctx.params;
    const { populate } = ctx.query;
    const { sanitizeOutput } = getWorkflowsPermissionChecker({ strapi }, ctx.state.userAbility);

    const workflowService = getService('workflows');
    const workflow = await workflowService.findById(id, { populate });

    ctx.body = {
      data: await sanitizeOutput(workflow),
    };
  },
};
