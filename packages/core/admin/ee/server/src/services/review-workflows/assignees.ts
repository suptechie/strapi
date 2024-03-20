import type { Core } from '@strapi/types';
import { errors } from '@strapi/utils';
import { isNil } from 'lodash/fp';
import { ENTITY_ASSIGNEE_ATTRIBUTE } from '../../constants/workflows';
import { getService } from '../../utils';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const metrics = getService('review-workflows-metrics', { strapi });

  return {
    async findEntityAssigneeId(id: any, model: any) {
      const entity = await strapi.db.query(model).findOne({
        where: { id },
        populate: [ENTITY_ASSIGNEE_ATTRIBUTE],
        select: [],
      });

      return entity?.[ENTITY_ASSIGNEE_ATTRIBUTE]?.id ?? null;
    },

    /**
     * Update the assignee of an entity
     */
    async updateEntityAssignee(id: any, model: any, assigneeId: any) {
      if (isNil(assigneeId)) {
        return this.deleteEntityAssignee(id, model);
      }

      const userExists = await getService('user', { strapi }).exists({ id: assigneeId });

      if (!userExists) {
        throw new ApplicationError(`Selected user does not exist`);
      }

      metrics.sendDidEditAssignee(await this.findEntityAssigneeId(id, model), assigneeId);

      return strapi.db.query(model).update({
        where: { id },
        data: { [ENTITY_ASSIGNEE_ATTRIBUTE]: assigneeId },
        populate: [ENTITY_ASSIGNEE_ATTRIBUTE],
        select: [],
      });
    },

    async deleteEntityAssignee(id: any, model: any) {
      metrics.sendDidEditAssignee(await this.findEntityAssigneeId(id, model), null);

      return strapi.db.query(model).update({
        where: { id },
        data: { [ENTITY_ASSIGNEE_ATTRIBUTE]: null },
        populate: [ENTITY_ASSIGNEE_ATTRIBUTE],
        select: [],
      });
    },
  };
};
