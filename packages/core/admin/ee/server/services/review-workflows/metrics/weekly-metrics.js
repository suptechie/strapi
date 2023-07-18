'use strict';

const { flow, map, sum, size, mean, max, defaultTo } = require('lodash/fp');
const { add } = require('date-fns');

const { ONE_WEEK, getWeeklyCronScheduleAt } = require('@strapi/utils').cron;
const { getService } = require('../../../../../server/utils');

const getMetricsStoreValue = async () => {
  const value = await strapi.store.get({ type: 'plugin', name: 'ee', key: 'metrics' });
  return defaultTo({}, value);
};
const setMetricsStoreValue = (value) =>
  strapi.store.set({ type: 'plugin', name: 'ee', key: 'metrics', value });

module.exports = ({ strapi }) => {
  const metrics = getService('review-workflows-metrics', { strapi });
  const workflowsService = getService('workflows', { strapi });

  return {
    async computeMetrics() {
      // There will never be more than 200 workflow, so we can safely fetch them all
      const workflows = await workflowsService.findMany({ populate: 'stages' });

      const stagesCount = flow(
        map('stages'), // Number of stages per workflow
        map(size)
      )(workflows);

      const contentTypesCount = flow(
        map('contentTypes'), // Number of content types per workflow
        map(size)
      )(workflows);

      return {
        numberOfActiveWorkflows: size(workflows),
        avgStagesCount: mean(stagesCount),
        maxStagesCount: max(stagesCount),
        activatedContentTypes: sum(contentTypesCount),
      };
    },

    async sendMetrics() {
      const computedMetrics = this.computeMetrics();
      metrics.sendDidSendReviewWorkflowPropertiesOnceAWeek(computedMetrics);

      const metricsInfoStored = await getMetricsStoreValue();
      await setMetricsStoreValue({ ...metricsInfoStored, lastWeeklyUpdate: new Date().getTime() });
    },

    async ensureWeeklyStoredCronSchedule() {
      const metricsInfoStored = await getMetricsStoreValue();
      const { weeklySchedule: currentSchedule, lastWeeklyUpdate } = metricsInfoStored;

      const now = new Date();
      let weeklySchedule = currentSchedule;

      if (!currentSchedule || !lastWeeklyUpdate || lastWeeklyUpdate + ONE_WEEK < now.getTime()) {
        weeklySchedule = getWeeklyCronScheduleAt(add(now, { minutes: 5 }));
        await setMetricsStoreValue({ ...metricsInfoStored, weeklySchedule });
      }

      return weeklySchedule;
    },

    async registerCron() {
      const weeklySchedule = await this.ensureWeeklyStoredCronSchedule();

      strapi.cron.add({ [weeklySchedule]: this.sendMetrics.bind(this) });
    },
  };
};
