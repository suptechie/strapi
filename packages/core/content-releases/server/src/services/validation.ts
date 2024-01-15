import { errors } from '@strapi/utils';
import { LoadedStrapi } from '@strapi/types';
import type { Release } from '../../../shared/contracts/releases';
import type { CreateReleaseAction } from '../../../shared/contracts/release-actions';
import { RELEASE_MODEL_UID } from '../constants';

const createReleaseValidationService = ({ strapi }: { strapi: LoadedStrapi }) => ({
  async validateUniqueEntry(
    releaseId: CreateReleaseAction.Request['params']['releaseId'],
    releaseActionArgs: CreateReleaseAction.Request['body']
  ) {
    /**
     * Asserting the type, otherwise TS complains: 'release.actions' is of type 'unknown', even though the types come through for non-populated fields...
     * Possibly related to the comment on GetValues: https://github.com/strapi/strapi/blob/main/packages/core/types/src/modules/entity-service/result.ts
     */
    const release = (await strapi.entityService.findOne(RELEASE_MODEL_UID, releaseId, {
      populate: { actions: { populate: { entry: { fields: ['id'] } } } },
    })) as Release | null;

    if (!release) {
      throw new errors.NotFoundError(`No release found for id ${releaseId}`);
    }

    const isEntryInRelease = release.actions.some(
      (action) =>
        Number(action.entry.id) === Number(releaseActionArgs.entry.id) &&
        action.contentType === releaseActionArgs.entry.contentType
    );

    if (isEntryInRelease) {
      throw new errors.ValidationError(
        `Entry with id ${releaseActionArgs.entry.id} and contentType ${releaseActionArgs.entry.contentType} already exists in release with id ${releaseId}`
      );
    }
  },
  validateEntryContentType(
    contentTypeUid: CreateReleaseAction.Request['body']['entry']['contentType']
  ) {
    const contentType = strapi.contentType(contentTypeUid);

    if (!contentType) {
      throw new errors.NotFoundError(`No content type found for uid ${contentTypeUid}`);
    }

    // TODO: V5 migration - All contentType will have draftAndPublish enabled
    if (!contentType.options?.draftAndPublish) {
      throw new errors.ValidationError(
        `Content type with uid ${contentTypeUid} does not have draftAndPublish enabled`
      );
    }
  },
});

export default createReleaseValidationService;
