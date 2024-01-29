import { LoadedStrapi } from '@strapi/types';
import { createTestSetup, destroyTestSetup } from '../../../utils/builder-helper';
import resources from './resources/index';
import { CATEGORY_UID, Category } from './utils';

describe('Document Service', () => {
  let testUtils;
  let strapi: LoadedStrapi;

  let testName;
  let createdCategory;
  beforeAll(async () => {
    testUtils = await createTestSetup(resources);
    strapi = testUtils.strapi;
    testName = testUtils.data.category[0].name;
  });

  afterAll(async () => {
    await destroyTestSetup(testUtils);
  });

  describe('Unique fields', () => {
    it('cannot create a document with a duplicated unique field value in the same publication state', async () => {
      expect(async () => {
        await strapi.documents(CATEGORY_UID).create({
          data: { name: testName },
        });
      }).rejects.toThrow();
    });

    it('cannot update a document to have a duplicated unique field value in the same publication state', async () => {
      const uniqueName = `${testName}-1`;

      const category: Category = await strapi.documents(CATEGORY_UID).create({
        data: { name: uniqueName },
      });
      createdCategory = category;

      expect(async () => {
        await strapi.documents(CATEGORY_UID).update(category.documentId, {
          data: { name: testName },
        });
      }).rejects.toThrow();
    });

    it('cannot publish a document to have a duplicated unique field value in the same publication state', async () => {
      const updatedName = `${createdCategory.name}-1`;
      // Update the previously created category to have a new name
      const category: Category = await strapi
        .documents(CATEGORY_UID)
        .update(createdCategory.documentId, {
          data: { name: updatedName },
        });

      // Publish that category
      const publishRes = strapi.documents(CATEGORY_UID).publish(category.documentId);
      await expect(publishRes).resolves.not.toThrowError();

      // Reset the name of the draft category
      await strapi.documents(CATEGORY_UID).update(createdCategory.documentId, {
        data: { name: createdCategory.name },
      });

      // Now we can create a new category with the same name as the published category
      // When we try to publish it, it should throw an error
      const newCategory: Category = await strapi.documents(CATEGORY_UID).create({
        data: { name: updatedName },
      });

      expect(async () => {
        await strapi.documents(CATEGORY_UID).publish(newCategory.documentId);
      }).rejects.toThrow();
    });
  });
});
