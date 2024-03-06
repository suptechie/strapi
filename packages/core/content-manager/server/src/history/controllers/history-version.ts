import { errors } from '@strapi/utils';
import type { Core, UID } from '@strapi/types';
import { getService as getContentManagerService } from '../../utils';
import { getService } from '../utils';
import { HistoryVersions } from '../../../../shared/contracts';

const createHistoryVersionController = ({ strapi }: { strapi: Core.Strapi }) => {
  return {
    async findMany(ctx) {
      const contentTypeUid = ctx.query.contentType as UID.ContentType;
      const isSingleType = strapi.getModel(contentTypeUid).kind === 'singleType';

      if (isSingleType && !contentTypeUid) {
        throw new errors.ForbiddenError('contentType is required');
      }

      if (!contentTypeUid && !ctx.query.documentId) {
        throw new errors.ForbiddenError('contentType and documentId are required');
      }

      const params = ctx.query as HistoryVersions.GetHistoryVersions.Request['query'];

      /**
       * There are no permissions specifically for history versions,
       * but we need to check that the user can read the content type
       */
      const permissionChecker = getContentManagerService('permission-checker').create({
        userAbility: ctx.state.userAbility,
        model: params.contentType,
      });

      if (permissionChecker.cannot.read()) {
        return ctx.forbidden();
      }

      const { results, pagination } = await getService(strapi, 'history').findVersionsPage(params);

      return { data: results, meta: { pagination } };
    },
  } satisfies Core.Controller;
};

export { createHistoryVersionController };
