import { Common } from '@strapi/types';
import { setCreatorFields, pipeAsync, errors } from '@strapi/utils';

import { getDocumentLocaleAndStatus } from './utils/dimensions';
import { getService } from '../utils';

const buildPopulateFromQuery = async (query: any, model: any) => {
  return getService('populate-builder')(model)
    .populateFromQuery(query)
    .populateDeep(Infinity)
    .countRelations()
    .build();
};

const findDocument = async (query: any, uid: Common.UID.SingleType, opts: any = {}) => {
  const documentManager = getService('document-manager');
  const populate = await buildPopulateFromQuery(query, uid);

  return (
    documentManager
      .findMany({ ...opts, populate }, uid)
      // Return the first document found
      .then((documents: any) => documents[0])
  );
};

const createOrUpdateDocument = async (ctx: any, opts?: { populate: object }) => {
  const { user, userAbility } = ctx.state;
  const { model } = ctx.params;
  const { body, query } = ctx.request;

  const documentManager = getService('document-manager');
  const permissionChecker = getService('permission-checker').create({ userAbility, model });

  if (permissionChecker.cannot.create() && permissionChecker.cannot.update()) {
    throw new errors.ForbiddenError();
  }

  const sanitizedQuery = await permissionChecker.sanitizedQuery.update(query);

  const { locale } = getDocumentLocaleAndStatus(body);

  // Load document version to update
  const [documentVersion, otherDocumentVersion] = await Promise.all([
    findDocument(sanitizedQuery, model, { locale, status: 'draft' }),
    // Find the first document to check if it exists
    strapi.db.query(model).findOne({ select: ['documentId'] }),
  ]);

  const documentId = otherDocumentVersion?.documentId;

  const pickPermittedFields = documentVersion
    ? permissionChecker.sanitizeUpdateInput(documentVersion)
    : permissionChecker.sanitizeCreateInput;

  const setCreator = documentVersion
    ? setCreatorFields({ user, isEdition: true })
    : setCreatorFields({ user });

  const sanitizeFn = pipeAsync(pickPermittedFields, setCreator as any);

  // If version is not found, but document exists,
  // the intent is to create a new document locale
  if (documentVersion) {
    if (permissionChecker.cannot.update(documentVersion)) {
      throw new errors.ForbiddenError();
    }
  } else if (permissionChecker.cannot.create()) {
    throw new errors.ForbiddenError();
  }

  const sanitizedBody = await sanitizeFn(body);

  if (!documentId) {
    return documentManager.create(model, {
      data: sanitizedBody,
      ...sanitizedQuery,
      locale,
    });
  }

  return documentManager.update(documentId, model, {
    data: sanitizedBody as any,
    populate: opts?.populate,
    locale,
  });
};

export default {
  async find(ctx: any) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const { query = {} } = ctx.request;

    const permissionChecker = getService('permission-checker').create({ userAbility, model });
    const documentMetadata = getService('document-metadata');

    if (permissionChecker.cannot.read()) {
      return ctx.forbidden();
    }

    const permissionQuery = await permissionChecker.sanitizedQuery.read(query);
    const { locale, status } = getDocumentLocaleAndStatus(query);

    const version = await findDocument(permissionQuery, model, { locale, status });

    // allow user with create permission to know a single type is not created
    if (!version) {
      if (permissionChecker.cannot.create()) {
        return ctx.forbidden();
      }
      // Check if document exists
      const document = await strapi.db.query(model).findOne({});

      if (!document) {
        return ctx.notFound();
      }

      // If the requested locale doesn't exist, return an empty response
      const { meta } = await documentMetadata.formatDocumentWithMetadata(
        model,
        { id: document.documentId, locale, publishedAt: null },
        { availableLocales: true, availableStatus: false }
      );
      ctx.body = { data: {}, meta };
      return;
    }

    if (permissionChecker.cannot.read(version)) {
      return ctx.forbidden();
    }

    const sanitizedDocument = await permissionChecker.sanitizeOutput(version);
    ctx.body = await documentMetadata.formatDocumentWithMetadata(model, sanitizedDocument);
  },

  async createOrUpdate(ctx: any) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;

    const documentMetadata = getService('document-metadata');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    const document = await createOrUpdateDocument(ctx);
    const sanitizedDocument = await permissionChecker.sanitizeOutput(document);
    ctx.body = await documentMetadata.formatDocumentWithMetadata(model, sanitizedDocument);
  },

  async delete(ctx: any) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const { query = {} } = ctx.request;

    const documentManager = getService('document-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.delete()) {
      return ctx.forbidden();
    }

    const sanitizedQuery = await permissionChecker.sanitizedQuery.delete(query);
    const { locale } = getDocumentLocaleAndStatus(query);

    const document = await findDocument(sanitizedQuery, model, { locale });

    if (!document) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.delete(document)) {
      return ctx.forbidden();
    }

    const deletedEntity = await documentManager.delete(document.documentId, model, { locale });

    ctx.body = await permissionChecker.sanitizeOutput(deletedEntity);
  },

  async publish(ctx: any) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const { query = {} } = ctx.request;

    const documentManager = getService('document-manager');
    const documentMetadata = getService('document-metadata');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.publish()) {
      return ctx.forbidden();
    }

    const publishedDocument = await strapi.db.transaction(async () => {
      const sanitizedQuery = await permissionChecker.sanitizedQuery.publish(query);
      const populate = await buildPopulateFromQuery(sanitizedQuery, model);
      const document = await createOrUpdateDocument(ctx, { populate });

      if (!document) {
        throw new errors.NotFoundError();
      }

      if (permissionChecker.cannot.publish(document)) {
        throw new errors.ForbiddenError();
      }

      const { locale } = getDocumentLocaleAndStatus(document);
      return documentManager.publish(document.documentId, model, { locale });
    });

    const sanitizedDocument = await permissionChecker.sanitizeOutput(publishedDocument);
    ctx.body = await documentMetadata.formatDocumentWithMetadata(model, sanitizedDocument);
  },

  async unpublish(ctx: any) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const {
      body: { discardDraft, ...body },
      query = {},
    } = ctx.request;

    const documentManager = getService('document-manager');
    const documentMetadata = getService('document-metadata');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.unpublish()) {
      return ctx.forbidden();
    }

    if (discardDraft && permissionChecker.cannot.discard()) {
      return ctx.forbidden();
    }

    const sanitizedQuery = await permissionChecker.sanitizedQuery.unpublish(query);
    const { locale } = getDocumentLocaleAndStatus(body);

    const document = await findDocument(sanitizedQuery, model, { locale });

    if (!document) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.unpublish(document)) {
      return ctx.forbidden();
    }

    if (discardDraft && permissionChecker.cannot.discard(document)) {
      return ctx.forbidden();
    }

    await strapi.db.transaction(async () => {
      if (discardDraft) {
        await documentManager.discardDraft(document.documentId, model, { locale });
      }

      ctx.body = await pipeAsync(
        (document) => documentManager.unpublish(document.documentId, model, { locale }),
        permissionChecker.sanitizeOutput,
        (document) => documentMetadata.formatDocumentWithMetadata(model, document)
      )(document);
    });
  },

  async discard(ctx: any) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const { body, query = {} } = ctx.request;

    const documentManager = getService('document-manager');
    const documentMetadata = getService('document-metadata');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.discard()) {
      return ctx.forbidden();
    }

    const sanitizedQuery = await permissionChecker.sanitizedQuery.discard(query);
    const { locale } = getDocumentLocaleAndStatus(body);

    const document = await findDocument(sanitizedQuery, model, { locale, status: 'published' });

    // Can not discard a document that is not published
    if (!document) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.discard(document)) {
      return ctx.forbidden();
    }

    ctx.body = await pipeAsync(
      (document) => documentManager.discardDraft(document.documentId, model, { locale }),
      permissionChecker.sanitizeOutput,
      (document) => documentMetadata.formatDocumentWithMetadata(model, document)
    )(document);
  },

  async countDraftRelations(ctx: any) {
    const { userAbility } = ctx.state;
    const { model } = ctx.params;
    const { query } = ctx.request;
    const documentManager = getService('document-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    const { locale } = getDocumentLocaleAndStatus(query);

    if (permissionChecker.cannot.read()) {
      return ctx.forbidden();
    }

    const document = await findDocument({}, model);
    if (!document) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.read(document)) {
      return ctx.forbidden();
    }

    const number = await documentManager.countDraftRelations(document.documentId, model, locale);

    return {
      data: number,
    };
  },
};
