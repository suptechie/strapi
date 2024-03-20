import type { Core } from '@strapi/types';

export default async ({ strapi }: { strapi: Core.LoadedStrapi }) => {
  const actions = [
    {
      section: 'plugins',
      displayName: 'Read',
      uid: 'read',
      pluginName: 'content-type-builder',
    },
  ];

  await strapi.admin.services.permission.actionProvider.registerMany(actions);
};
