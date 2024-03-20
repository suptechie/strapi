import type { Core, Modules } from '@strapi/types';

import { createMiddlewareManager, databaseErrorsMiddleware } from './middlewares';
import { createContentTypeRepository } from './repository';

/**
 * Repository to :
 * - Access documents via actions (findMany, findOne, create, update, delete, ...)
 * - Execute middlewares on document actions
 * - Apply default parameters to document actions
 *
 * @param strapi
 * @param options.defaults - Default parameters to apply to all actions
 * @param options.parent - Parent repository, used when creating a new repository with .with()
 * @returns DocumentService
 *
 * @example Access documents
 * const article = strapi.documents('api::article.article').create(params)
 * const allArticles = strapi.documents('api::article.article').findMany(params)
 *
 */
// TODO: support global document service middleware & per repo middlewares
export const createDocumentService = (strapi: Core.Strapi): Modules.Documents.Service => {
  const repositories = new Map<string, Modules.Documents.ServiceInstance>();
  const middlewares = createMiddlewareManager();

  middlewares.use(databaseErrorsMiddleware);

  const factory = function factory(uid) {
    if (repositories.has(uid)) {
      return repositories.get(uid)!;
    }

    const contentType = strapi.contentType(uid);
    const repository = createContentTypeRepository(uid);

    repositories.set(uid, middlewares.wrapObject(repository, { contentType }));

    return repository;
  } as Modules.Documents.Service;

  return Object.assign(factory, {
    use: middlewares.use.bind(middlewares),
  });
};
