import { sanitize, validate } from '@strapi/utils';
import type { Internal, Schema } from '@strapi/types';

import type { Context } from '../../types';

export default ({ strapi }: Context) => ({
  buildComponentResolver({
    contentTypeUID,
    attributeName,
  }: {
    contentTypeUID: Internal.UID.ContentType;
    attributeName: string;
  }) {
    const { transformArgs } = strapi.plugin('graphql').service('builders').utils;

    return async (parent: any, args: any, ctx: any) => {
      const contentType = strapi.getModel(contentTypeUID);

      const { component: componentName } = contentType.attributes[
        attributeName
      ] as Schema.Attribute.Component;

      const component = strapi.getModel(componentName);

      const transformedArgs = transformArgs(args, { contentType: component, usePagination: true });
      await validate.contentAPI.query(transformedArgs, component, {
        auth: ctx?.state?.auth,
      });

      const sanitizedQuery = await sanitize.contentAPI.query(transformedArgs, component, {
        auth: ctx?.state?.auth,
      });

      return strapi.db?.query(contentTypeUID).load(parent, attributeName, sanitizedQuery);
    };
  },
});
