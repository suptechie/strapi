import type { Core } from '@strapi/types';

import { createTestSetup, destroyTestSetup } from '../../../utils/builder-helper';
import { testInTransaction } from '../../../utils/index';
import resources from './resources/index';
import { ARTICLE_UID, findArticleDb } from './utils';

describe('Document Service', () => {
  let testUtils;
  let strapi: Core.Strapi;

  beforeAll(async () => {
    testUtils = await createTestSetup(resources);
    strapi = testUtils.strapi;
  });

  afterAll(async () => {
    await destroyTestSetup(testUtils);
  });

  describe('Update', () => {
    testInTransaction('update a document with defaults', async () => {
      const articleDb = await findArticleDb({ title: 'Article1-Draft-EN' });
      const newName = 'Updated Document';

      const article = await strapi
        .documents(ARTICLE_UID)
        .update({ documentId: articleDb.documentId, data: { title: newName } });

      // verify that the returned document was updated
      expect(article).toMatchObject({
        ...articleDb,
        title: newName,
        updatedAt: article.updatedAt,
      });

      // verify it was updated in the database
      const updatedArticleDb = await findArticleDb({ title: newName });
      expect(updatedArticleDb).toMatchObject({
        ...articleDb,
        title: newName,
        updatedAt: article.updatedAt,
      });
    });

    testInTransaction('update document component', async () => {
      const articleDb = await findArticleDb({ title: 'Article1-Draft-EN' });
      const dataToUpdate = {
        comp: {
          text: 'comp-1',
        },
        dz: [
          {
            __component: 'article.dz-comp',
            name: 'dz-comp-1',
          },
        ],
      } as const;

      const article = await strapi.documents(ARTICLE_UID).update({
        documentId: articleDb.documentId,
        data: {
          comp: dataToUpdate.comp,
          dz: [...dataToUpdate.dz],
        },
        populate: ['comp', 'dz'],
      });

      // verify that the returned document was updated
      expect(article).toMatchObject({
        ...articleDb,
        ...dataToUpdate,
        updatedAt: article.updatedAt,
      });
    });

    testInTransaction('update a document locale', async () => {
      const articleDb = await findArticleDb({ title: 'Article1-Draft-NL' });
      const newName = 'updated document';

      // Update an existing locale of a document
      const article = await strapi
        .documents(ARTICLE_UID)
        .update({ documentId: articleDb.documentId, locale: 'nl', data: { title: newName } });

      // verify that the returned document was updated
      expect(article).toMatchObject({
        ...articleDb,
        title: newName,
        updatedAt: article.updatedAt,
      });

      // verify it was updated in the database
      const updatedArticleDb = await findArticleDb({ title: newName });
      expect(updatedArticleDb).toMatchObject({
        documentId: articleDb.documentId,
        locale: 'nl',
        title: newName,
        updatedAt: article.updatedAt,
      });

      // verity others locales are not updated
      const enLocale = await findArticleDb({ title: 'Article1-Draft-EN' });
      expect(enLocale).toBeDefined();
    });

    testInTransaction('create a new localization for an existing document', async () => {
      const articleDb = await findArticleDb({ title: 'Article1-Draft-EN' });
      const newName = 'updated document';

      // Create a new article in spanish
      const article = await strapi.documents(ARTICLE_UID).update({
        documentId: articleDb.documentId,
        locale: 'es',
        data: { title: newName, password: '123456' },
      });

      // verify that the returned document was updated
      expect(article).toMatchObject({
        documentId: articleDb.documentId,
        locale: 'es',
        title: newName,
        updatedAt: article.updatedAt,
      });

      // verify it was updated in the database
      const updatedArticleDb = await findArticleDb({ title: newName });
      expect(updatedArticleDb).toMatchObject(article);

      // verity others locales are not updated
      const enLocale = await findArticleDb({ title: 'Article1' });
      expect(enLocale).toBeDefined();
    });

    // TODO
    it.todo('can update and publish');

    testInTransaction('document to update does not exist', async () => {
      const article = await strapi.documents(ARTICLE_UID).update({
        documentId: 'does-not-exist',
        data: { title: 'updated document' },
      });

      expect(article).toBeNull();
    });
  });
});
