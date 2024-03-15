/* eslint-disable @typescript-eslint/no-var-requires */
import type { LoadedStrapi } from '@strapi/types';

import { ACTIONS, RELEASE_MODEL_UID, RELEASE_ACTION_MODEL_UID } from './constants';
import {
  deleteActionsOnDeleteContentType,
  migrateIsValidAndStatusReleases,
  revalidateChangedContentTypes,
  disableContentTypeLocalized,
  enableContentTypeLocalized,
} from './migrations';

export const register = async ({ strapi }: { strapi: LoadedStrapi }) => {
  if (strapi.ee.features.isEnabled('cms-content-releases')) {
    await strapi.admin.services.permission.actionProvider.registerMany(ACTIONS);

    strapi.hook('strapi::content-types.beforeSync').register(disableContentTypeLocalized);
    strapi
      .hook('strapi::content-types.afterSync')
      .register(deleteActionsOnDeleteContentType)
      .register(enableContentTypeLocalized)
      .register(revalidateChangedContentTypes)
      .register(migrateIsValidAndStatusReleases);
  }

  if (strapi.plugin('graphql')) {
    const graphqlExtensionService = strapi.plugin('graphql').service('extension');
    // Exclude the release and release action models from the GraphQL schema
    graphqlExtensionService.shadowCRUD(RELEASE_MODEL_UID).disable();
    graphqlExtensionService.shadowCRUD(RELEASE_ACTION_MODEL_UID).disable();
  }
};
