/* eslint-disable @typescript-eslint/no-var-requires */
import type { LoadedStrapi } from '@strapi/types';

import { ACTIONS } from './constants';
import {
  deleteActionsOnDeleteContentType,
  migrateIsValidAndStatusReleases,
  revalidateChangedContentTypes,
} from './migrations';

export const register = async ({ strapi }: { strapi: LoadedStrapi }) => {
  if (strapi.ee.features.isEnabled('cms-content-releases')) {
    await strapi.admin.services.permission.actionProvider.registerMany(ACTIONS);

    strapi
      .hook('strapi::content-types.afterSync')
      .register(deleteActionsOnDeleteContentType)
      .register(revalidateChangedContentTypes)
      .register(migrateIsValidAndStatusReleases);
  }
};
