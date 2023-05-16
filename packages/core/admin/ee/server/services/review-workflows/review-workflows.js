'use strict';

const { set, forEach, pipe, map } = require('lodash/fp');
const { getService } = require('../../utils');
const { getVisibleContentTypesUID } = require('../../utils/review-workflows');

const defaultStages = require('../../constants/default-stages.json');
const defaultWorkflow = require('../../constants/default-workflow.json');
const { ENTITY_STAGE_ATTRIBUTE } = require('../../constants/workflows');

const { persistTables, removePersistedTablesWithSuffix } = require('../../utils/persisted-tables');

async function initDefaultWorkflow({ workflowsService, stagesService }) {
  const wfCount = await workflowsService.count();
  const stagesCount = await stagesService.count();

  // Check if there is nothing about review-workflow in DB
  // If any, the feature has already been initialized with a workflow and stages
  if (wfCount === 0 && stagesCount === 0) {
    const workflow = {
      ...defaultWorkflow,
      stages: defaultStages,
    };

    await workflowsService.create({ data: workflow });
  }
}

function extendReviewWorkflowContentTypes({ strapi }) {
  const extendContentType = (contentTypeUID) => {
    const setStageAttribute = set(`attributes.${ENTITY_STAGE_ATTRIBUTE}`, {
      writable: true,
      private: false,
      configurable: false,
      visible: false,
      useJoinTable: true, // We want a join table to persist data when downgrading to CE
      type: 'relation',
      relation: 'oneToOne',
      target: 'admin::workflow-stage',
    });
    strapi.container.get('content-types').extend(contentTypeUID, setStageAttribute);
  };

  pipe([
    getVisibleContentTypesUID,
    // Iterate over UIDs to extend the content-type
    forEach(extendContentType),
  ])(strapi.contentTypes);
}

function persistStagesJoinTables({ strapi }) {
  return async ({ contentTypes }) => {
    const getStageTableToPersist = (contentTypeUID) => {
      // Persist the stage join table
      const { attributes, tableName } = strapi.db.metadata.get(contentTypeUID);
      const joinTableName = attributes[ENTITY_STAGE_ATTRIBUTE].joinTable.name;
      return { name: joinTableName, dependsOn: [{ name: tableName }] };
    };

    const joinTablesToPersist = pipe([getVisibleContentTypesUID, map(getStageTableToPersist)])(
      contentTypes
    );

    // TODO: Instead of removing all the tables, we should only remove the ones that are not in the joinTablesToPersist
    await removePersistedTablesWithSuffix('_strapi_review_workflows_stage_links');
    await persistTables(joinTablesToPersist);
  };
}

module.exports = ({ strapi }) => {
  const workflowsService = getService('workflows', { strapi });
  const stagesService = getService('stages', { strapi });

  return {
    async bootstrap() {
      await initDefaultWorkflow({ workflowsService, stagesService, strapi });
    },
    async register() {
      extendReviewWorkflowContentTypes({ strapi });
      strapi.hook('strapi::content-types.afterSync').register(persistStagesJoinTables({ strapi }));
    },
  };
};
