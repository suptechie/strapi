import { prop } from 'lodash/fp';
import type Koa from 'koa';
import { contentTypes as contentTypeUtils, sanitize, validate } from '@strapi/utils';
import type { Core, Struct } from '@strapi/types';

import { transformResponse } from './transform';
import createSingleTypeController from './single-type';
import createCollectionTypeController from './collection-type';

const isSingleType = (
  contentType: Struct.ContentTypeSchema
): contentType is Struct.SingleTypeSchema => contentTypeUtils.isSingleType(contentType);

const getAuthFromKoaContext = (ctx: Koa.Context) => prop('state.auth', ctx) ?? {};

function createController<T extends Struct.SingleTypeSchema | Struct.CollectionTypeSchema>(opts: {
  contentType: T;
}): T extends Struct.SingleTypeSchema
  ? Core.CoreAPI.Controller.SingleType
  : Core.CoreAPI.Controller.CollectionType;
function createController({
  contentType,
}: {
  contentType: Struct.SingleTypeSchema | Struct.CollectionTypeSchema;
}) {
  const proto: Core.CoreAPI.Controller.Base = {
    transformResponse(data, meta) {
      return transformResponse(data, meta, { contentType });
    },

    async sanitizeOutput(data, ctx) {
      const auth = getAuthFromKoaContext(ctx);

      return sanitize.contentAPI.output(data, contentType, { auth });
    },

    async sanitizeInput(data, ctx) {
      const auth = getAuthFromKoaContext(ctx);

      return sanitize.contentAPI.input(data, contentType, { auth });
    },

    async sanitizeQuery(ctx) {
      const auth = getAuthFromKoaContext(ctx);

      return sanitize.contentAPI.query(ctx.query, contentType, { auth });
    },

    async validateQuery(ctx) {
      const auth = getAuthFromKoaContext(ctx);

      return validate.contentAPI.query(ctx.query, contentType, { auth });
    },

    async validateInput(data, ctx) {
      const auth = getAuthFromKoaContext(ctx);

      return validate.contentAPI.input(data, contentType, { auth });
    },
  };

  let ctrl;

  if (isSingleType(contentType)) {
    ctrl = createSingleTypeController({ contentType });
  } else {
    ctrl = createCollectionTypeController({ contentType });
  }

  return Object.assign(Object.create(proto), ctrl);
}

export { createController };
