import { omit, assoc, merge, curry } from 'lodash/fp';

import { async, contentTypes as contentTypesUtils } from '@strapi/utils';

import { wrapInTransaction, type RepositoryFactoryMethod } from './common';
import * as DP from './draft-and-publish';
import * as i18n from './internationalization';
import * as components from './components';

import { createEntriesService } from './entries';
import { pickSelectionParams } from './params';
import { createDocumentId } from '../../utils/transform-content-types-to-models';
import { getDeepPopulate } from './utils/populate';
import { transformParamsToQuery } from './transform/query';
import { transformParamsDocumentId } from './transform/id-transform';
import { createEventManager } from './events';

export const createContentTypeRepository: RepositoryFactoryMethod = (uid) => {
  const contentType = strapi.contentType(uid);
  const hasDraftAndPublish = contentTypesUtils.hasDraftAndPublish(contentType);

  const entries = createEntriesService(uid);

  const eventManager = createEventManager(strapi, uid);
  const emitEvent = curry(eventManager.emitEvent);

  async function findMany(params = {} as any) {
    const query = await async.pipe(
      DP.defaultToDraft,
      DP.statusToLookup(contentType),
      i18n.defaultLocale(contentType),
      i18n.multiLocaleToLookup(contentType),
      transformParamsDocumentId(uid),
      transformParamsToQuery(uid)
    )(params || {});

    return strapi.db.query(uid).findMany(query);
  }

  async function findFirst(params = {} as any) {
    const query = await async.pipe(
      DP.defaultToDraft,
      DP.statusToLookup(contentType),
      i18n.defaultLocale(contentType),
      i18n.localeToLookup(contentType),
      transformParamsDocumentId(uid),
      transformParamsToQuery(uid)
    )(params);

    return strapi.db.query(uid).findOne(query);
  }

  // TODO: do we really want to add filters on the findOne now that we have findFirst ?
  async function findOne(opts = {} as any) {
    const { documentId, ...params } = opts;

    const query = await async.pipe(
      DP.defaultToDraft,
      DP.statusToLookup(contentType),
      i18n.defaultLocale(contentType),
      i18n.localeToLookup(contentType),
      transformParamsDocumentId(uid),
      transformParamsToQuery(uid),
      (query) => assoc('where', { ...query.where, documentId }, query)
    )(params);

    return strapi.db.query(uid).findOne(query);
  }

  async function deleteDocument(opts = {} as any) {
    const { documentId, ...params } = opts;

    const query = await async.pipe(
      omit('status'),
      i18n.defaultLocale(contentType),
      i18n.multiLocaleToLookup(contentType),
      transformParamsToQuery(uid),
      (query) => assoc('where', { ...query.where, documentId }, query)
    )(params);

    if (params.status === 'draft') {
      throw new Error('Cannot delete a draft document');
    }

    const entriesToDelete = await strapi.db.query(uid).findMany(query);

    // Delete all matched entries and its components
    const deletedEntries = await async.map(entriesToDelete, (entryToDelete: any) =>
      entries.delete(entryToDelete.id)
    );

    entriesToDelete.forEach(emitEvent('entry.delete'));

    return { documentId, entries: deletedEntries };
  }

  async function create(opts = {} as any) {
    const { documentId, ...params } = opts;

    const queryParams = await async.pipe(
      DP.filterDataPublishedAt,
      DP.setStatusToDraft(contentType),
      DP.statusToData(contentType),
      i18n.defaultLocale(contentType),
      i18n.localeToData(contentType)
    )(params);

    const doc = await entries.create(queryParams);

    emitEvent('entry.create', doc);

    if (hasDraftAndPublish && params.status === 'published') {
      return publish({
        ...params,
        documentId: doc.documentId,
      }).then((doc) => doc.entries[0]);
    }

    return doc;
  }

  async function clone(opts = {} as any) {
    const { documentId, ...params } = opts;

    const queryParams = await async.pipe(
      DP.filterDataPublishedAt,
      i18n.defaultLocale(contentType),
      i18n.multiLocaleToLookup(contentType)
    )(params);

    // Get deep populate
    const entriesToClone = await strapi.db.query(uid).findMany({
      where: {
        ...queryParams?.lookup,
        documentId,
        // DP Enabled: Clone drafts
        // DP Disabled: Clone only the existing version (published)
        publishedAt: { $null: hasDraftAndPublish },
      },
      populate: getDeepPopulate(uid, { relationalFields: ['id'] }),
    });

    const clonedEntries = await async.map(
      entriesToClone,
      async.pipe(
        omit('id'),
        // assign new documentId
        assoc('documentId', createDocumentId()),
        // Merge new data into it
        (data) => merge(data, queryParams.data),
        (data) => entries.create({ ...queryParams, data, status: 'draft' })
      )
    );

    clonedEntries.forEach(emitEvent('entry.create'));

    return { documentId: clonedEntries.at(0)?.documentId, entries: clonedEntries };
  }

  async function update(opts = {} as any) {
    const { documentId, ...params } = opts;

    const queryParams = await async.pipe(
      DP.filterDataPublishedAt,
      DP.setStatusToDraft(contentType),
      DP.statusToLookup(contentType),
      DP.statusToData(contentType),
      // Default locale will be set if not provided
      i18n.defaultLocale(contentType),
      i18n.localeToLookup(contentType),
      i18n.localeToData(contentType)
    )(params);

    const { data, ...restParams } = await transformParamsDocumentId(uid, queryParams || {});
    const query = transformParamsToQuery(uid, pickSelectionParams(restParams || {}) as any);

    // Validation
    // Find if document exists
    const entryToUpdate = await strapi.db
      .query(uid)
      .findOne({ ...query, where: { ...queryParams?.lookup, ...query?.where, documentId } });

    let updatedDraft = null;
    if (entryToUpdate) {
      updatedDraft = await entries.update(entryToUpdate, queryParams);
      emitEvent('entry.update', updatedDraft);
    }

    if (!updatedDraft) {
      const documentExists = await strapi.db
        .query(contentType.uid)
        .findOne({ where: { documentId } });

      if (documentExists) {
        updatedDraft = await entries.create({
          ...queryParams,
          data: { ...queryParams.data, documentId },
        });
        emitEvent('entry.create', updatedDraft);
      }
    }

    if (hasDraftAndPublish && updatedDraft && params.status === 'published') {
      return publish({
        ...params,
        documentId,
      }).then((doc) => doc.entries[0]);
    }

    return updatedDraft;
  }

  async function count(params = {} as any) {
    const query = await async.pipe(
      DP.defaultStatus(contentType),
      DP.statusToLookup(contentType),
      i18n.defaultLocale(contentType),
      i18n.localeToLookup(contentType),
      transformParamsToQuery(uid)
    )(params);

    return strapi.db.query(uid).count(query);
  }

  async function publish(opts = {} as any) {
    const { documentId, ...params } = opts;

    const queryParams = await async.pipe(
      i18n.defaultLocale(contentType),
      i18n.multiLocaleToLookup(contentType)
    )(params);

    const [draftsToPublish, publishedToDelete] = await Promise.all([
      strapi.db.query(uid).findMany({
        where: {
          ...queryParams?.lookup,
          documentId,
          publishedAt: null, // Ignore lookup
        },
        // Populate relations, media, compos and dz
        populate: getDeepPopulate(uid, { relationalFields: ['documentId', 'locale'] }),
      }),
      strapi.db.query(uid).findMany({
        where: {
          ...queryParams?.lookup,
          documentId,
          publishedAt: { $ne: null },
        },
        select: ['id'],
      }),
    ]);

    // Delete all published versions
    await async.map(publishedToDelete, (entry: any) => entries.delete(entry.id));

    // Transform draft entry data and create published versions
    const publishedEntries = await async.map(draftsToPublish, (draft: unknown) =>
      entries.publish(draft, queryParams)
    );

    publishedEntries.forEach(emitEvent('entry.publish'));
    return { documentId, entries: publishedEntries };
  }

  async function unpublish(opts = {} as any) {
    const { documentId, ...params } = opts;

    const query = await async.pipe(
      i18n.defaultLocale(contentType),
      i18n.multiLocaleToLookup(contentType),
      transformParamsToQuery(uid),
      (query) => assoc('where', { ...query.where, documentId, publishedAt: { $ne: null } }, query)
    )(params);

    // Delete all published versions
    const versionsToDelete = await strapi.db.query(uid).findMany(query);
    await async.map(versionsToDelete, (entry: any) => entries.delete(entry.id));

    versionsToDelete.forEach(emitEvent('entry.unpublish'));
    return { documentId, entries: versionsToDelete };
  }

  async function discardDraft(opts = {} as any) {
    const { documentId, ...params } = opts;

    const queryParams = await async.pipe(
      i18n.defaultLocale(contentType),
      i18n.multiLocaleToLookup(contentType)
    )(params);

    const [versionsToDraft, versionsToDelete] = await Promise.all([
      strapi.db.query(uid).findMany({
        where: {
          ...queryParams?.lookup,
          documentId,
          publishedAt: { $ne: null },
        },
        // Populate relations, media, compos and dz
        populate: getDeepPopulate(uid, { relationalFields: ['documentId', 'locale'] }),
      }),
      strapi.db.query(uid).findMany({
        where: {
          ...queryParams?.lookup,
          documentId,
          publishedAt: null,
        },
        select: ['id'],
      }),
    ]);

    // Delete all drafts
    await async.map(versionsToDelete, (entry: any) => entries.delete(entry.id));

    // Transform published entry data and create draft versions
    const draftEntries = await async.map(versionsToDraft, (entry: any) =>
      entries.discardDraft(entry, queryParams)
    );

    draftEntries.forEach(emitEvent('entry.draft-discard'));
    return { documentId, entries: draftEntries };
  }

  async function updateComponents(entry: any, data: any) {
    return components.updateComponents(uid, entry, data);
  }

  function omitComponentData(data: any) {
    return components.omitComponentData(contentType, data);
  }

  return {
    findMany: wrapInTransaction(findMany),
    findFirst: wrapInTransaction(findFirst),
    findOne: wrapInTransaction(findOne),
    delete: wrapInTransaction(deleteDocument),
    create: wrapInTransaction(create),
    clone: wrapInTransaction(clone),
    update: wrapInTransaction(update),
    count: wrapInTransaction(count),
    publish: hasDraftAndPublish ? wrapInTransaction(publish) : (undefined as any),
    unpublish: hasDraftAndPublish ? wrapInTransaction(unpublish) : (undefined as any),
    discardDraft: hasDraftAndPublish ? wrapInTransaction(discardDraft) : (undefined as any),

    updateComponents,
    omitComponentData,
  };
};
