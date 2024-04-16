import type { Core, Modules, UID, Data, Schema, Struct } from '@strapi/types';
import { contentTypes, errors } from '@strapi/utils';
import { omit, pick } from 'lodash/fp';

import { scheduleJob } from 'node-schedule';

import { FIELDS_TO_IGNORE, HISTORY_VERSION_UID } from '../constants';
import type { HistoryVersions } from '../../../../shared/contracts';
import {
  CreateHistoryVersion,
  HistoryVersionDataResponse,
} from '../../../../shared/contracts/history-versions';
import { getSchemaAttributesDiff } from './utils';

// Needed because the query engine doesn't return any types yet
type HistoryVersionQueryResult = Omit<HistoryVersionDataResponse, 'locale'> &
  Pick<CreateHistoryVersion, 'locale'>;

const DEFAULT_RETENTION_DAYS = 90;

const createHistoryService = ({ strapi }: { strapi: Core.Strapi }) => {
  const state: {
    deleteExpiredJob: ReturnType<typeof scheduleJob> | null;
    isInitialized: boolean;
  } = {
    deleteExpiredJob: null,
    isInitialized: false,
  };

  const query = strapi.db.query(HISTORY_VERSION_UID);

  const getRetentionDays = (strapi: Core.Strapi) => {
    const featureConfig = strapi.ee.features.get('cms-content-history');

    const licenseRetentionDays =
      typeof featureConfig === 'object' && featureConfig?.options.retentionDays;

    const userRetentionDays: number = strapi.config.get('admin.history.retentionDays');

    // Allow users to override the license retention days, but not to increase it
    if (userRetentionDays && userRetentionDays < licenseRetentionDays) {
      return userRetentionDays;
    }

    // User didn't provide retention days value, use the license or fallback to default
    return Math.min(licenseRetentionDays, DEFAULT_RETENTION_DAYS);
  };

  const localesService = strapi.plugin('i18n')?.service('locales');
  const getLocaleDictionary = async () => {
    if (!localesService) return {};

    const locales = (await localesService.find()) || [];
    return locales.reduce(
      (
        acc: Record<string, NonNullable<HistoryVersions.HistoryVersionDataResponse['locale']>>,
        locale: NonNullable<HistoryVersions.HistoryVersionDataResponse['locale']>
      ) => {
        acc[locale.code] = { name: locale.name, code: locale.code };

        return acc;
      },
      {}
    );
  };

  const getVersionStatus = async (
    contentTypeUid: HistoryVersions.CreateHistoryVersion['contentType'],
    document: Modules.Documents.AnyDocument | null
  ) => {
    const documentMetadataService = strapi.plugin('content-manager').service('document-metadata');
    const meta = await documentMetadataService.getMetadata(contentTypeUid, document);

    return documentMetadataService.getStatus(document, meta.availableStatus);
  };

  /**
   * Creates a populate object that looks for all the relations that need
   * to be saved in history, and populates only the fields needed to later retrieve the content.
   */
  const getDeepPopulate = (uid: UID.Schema) => {
    const model = strapi.getModel(uid);
    const attributes = Object.entries(model.attributes);

    return attributes.reduce((acc: any, [attributeName, attribute]) => {
      switch (attribute.type) {
        case 'relation': {
          const isVisible = contentTypes.isVisibleAttribute(model, attributeName);
          if (isVisible) {
            acc[attributeName] = { fields: ['documentId', 'locale', 'publishedAt'] };
          }
          break;
        }

        case 'media': {
          acc[attributeName] = { fields: ['id'] };
          break;
        }

        case 'component': {
          const populate = getDeepPopulate(attribute.component);
          acc[attributeName] = { populate };
          break;
        }

        case 'dynamiczone': {
          // Use fragments to populate the dynamic zone components
          const populatedComponents = (attribute.components || []).reduce(
            (acc: any, componentUID: UID.Component) => {
              acc[componentUID] = { populate: getDeepPopulate(componentUID) };
              return acc;
            },
            {}
          );

          acc[attributeName] = { on: populatedComponents };
          break;
        }
        default:
          break;
      }

      return acc;
    }, {});
  };

  return {
    async bootstrap() {
      // Prevent initializing the service twice
      if (state.isInitialized) {
        return;
      }
      /**
       * TODO: Fix the types for the middleware
       */
      strapi.documents.use(async (context, next) => {
        // Ignore requests that are not related to the content manager
        if (!strapi.requestContext.get()?.request.url.startsWith('/content-manager')) {
          return next();
        }

        // NOTE: can do type narrowing with array includes
        if (
          context.action !== 'create' &&
          context.action !== 'update' &&
          context.action !== 'publish' &&
          context.action !== 'unpublish' &&
          context.action !== 'discardDraft'
        ) {
          return next();
        }

        const contentTypeUid = context.contentType.uid;
        // Ignore content types not created by the user
        if (!contentTypeUid.startsWith('api::')) {
          return next();
        }

        const result = (await next()) as any;

        const documentContext =
          context.action === 'create'
            ? { documentId: result.documentId, locale: context.params?.locale }
            : { documentId: context.params.documentId, locale: context.params?.locale };

        const defaultLocale = localesService ? await localesService.getDefaultLocale() : null;
        const locale = documentContext.locale || defaultLocale;
        const document = await strapi.documents(contentTypeUid).findOne({
          documentId: documentContext.documentId,
          locale,
          populate: getDeepPopulate(contentTypeUid),
        });
        const status = await getVersionStatus(contentTypeUid, document);

        /**
         * Store schema of both the fields and the fields of the attributes, as it will let us know
         * if changes were made in the CTB since a history version was created,
         * and therefore which fields can be restored and which cannot.
         */
        const attributesSchema = strapi.getModel(contentTypeUid).attributes;
        const componentsSchemas: CreateHistoryVersion['componentsSchemas'] = Object.keys(
          attributesSchema
        ).reduce((currentComponentSchemas, key) => {
          const fieldSchema = attributesSchema[key];

          if (fieldSchema.type === 'component') {
            const componentSchema = strapi.getModel(fieldSchema.component).attributes;
            return {
              ...currentComponentSchemas,
              [fieldSchema.component]: componentSchema,
            };
          }

          // Ignore anything that's not a component
          return currentComponentSchemas;
        }, {});

        // Prevent creating a history version for an action that wasn't actually executed
        await strapi.db.transaction(async ({ onCommit }) => {
          onCommit(() => {
            this.createVersion({
              contentType: contentTypeUid,
              data: omit(FIELDS_TO_IGNORE, document),
              schema: omit(FIELDS_TO_IGNORE, attributesSchema),
              componentsSchemas,
              relatedDocumentId: documentContext.documentId,
              locale,
              status,
            });
          });
        });

        return result;
      });

      const retentionDays = getRetentionDays(strapi);
      // Schedule a job to delete expired history versions every day at midnight
      state.deleteExpiredJob = scheduleJob('0 0 * * *', () => {
        const retentionDaysInMilliseconds = retentionDays * 24 * 60 * 60 * 1000;
        const expirationDate = new Date(Date.now() - retentionDaysInMilliseconds);

        query.deleteMany({
          where: {
            created_at: {
              $lt: expirationDate.toISOString(),
            },
          },
        });
      });

      state.isInitialized = true;
    },

    async destroy() {
      if (state.deleteExpiredJob) {
        state.deleteExpiredJob.cancel();
      }
    },

    async createVersion(historyVersionData: HistoryVersions.CreateHistoryVersion) {
      await query.create({
        data: {
          ...historyVersionData,
          createdAt: new Date(),
          createdBy: strapi.requestContext.get()?.state?.user.id,
        },
      });
    },

    async findVersionsPage(params: HistoryVersions.GetHistoryVersions.Request['query']): Promise<{
      results: HistoryVersions.HistoryVersionDataResponse[];
      pagination: HistoryVersions.Pagination;
    }> {
      const [{ results, pagination }, localeDictionary] = await Promise.all([
        query.findPage({
          ...params,
          where: {
            $and: [
              { contentType: params.contentType },
              ...(params.documentId ? [{ relatedDocumentId: params.documentId }] : []),
              ...(params.locale ? [{ locale: params.locale }] : []),
            ],
          },
          populate: ['createdBy'],
          orderBy: [{ createdAt: 'desc' }],
        }),
        getLocaleDictionary(),
      ]);

      type EntryToPopulate =
        | {
            documentId: string;
            locale: string | null;
          }
        | { id: Data.ID }
        | null;

      /**
       * Get an object with two keys:
       * - results: an array with the current values of the relations
       * - meta: an object with the count of missing relations
       */
      const buildRelationReponse = async (
        values: EntryToPopulate[],
        attributeSchema: Schema.Attribute.AnyAttribute
      ): Promise<{ results: any[]; meta: { missingCount: number } }> => {
        return (
          values
            // Until we implement proper pagination, limit relations to an arbitrary amount
            .slice(0, 25)
            .reduce(
              async (currentRelationDataPromise, entry) => {
                const currentRelationData = await currentRelationDataPromise;

                // Entry can be null if it's a toOne relation
                if (!entry) {
                  return currentRelationData;
                }

                const isNormalRelation =
                  attributeSchema.type === 'relation' &&
                  attributeSchema.relation !== 'morphToOne' &&
                  attributeSchema.relation !== 'morphToMany';

                /**
                 * Adapt the query depending on if the attribute is a media
                 * or a normal relation. The extra checks are only for type narrowing
                 */
                let relatedEntry;
                if (isNormalRelation) {
                  if ('documentId' in entry) {
                    relatedEntry = await strapi
                      .documents(attributeSchema.target)
                      .findOne({ documentId: entry.documentId, locale: entry.locale || undefined });
                  }
                  // For media assets, only the id is available, double check that we have it
                } else if ('id' in entry) {
                  relatedEntry = await strapi.db
                    .query('plugin::upload.file')
                    .findOne({ where: { id: entry.id } });
                }

                if (relatedEntry) {
                  currentRelationData.results.push({
                    ...relatedEntry,
                    ...(isNormalRelation
                      ? {
                          status: await getVersionStatus(attributeSchema.target, relatedEntry),
                        }
                      : {}),
                  });
                } else {
                  // The related content has been deleted
                  currentRelationData.meta.missingCount += 1;
                }

                return currentRelationData;
              },
              Promise.resolve({
                results: [] as any[],
                meta: { missingCount: 0 },
              })
            )
        );
      };

      const populateEntryRelations = async (
        entry: HistoryVersionQueryResult
      ): Promise<CreateHistoryVersion['data']> => {
        const entryWithRelations = await Object.entries(entry.schema).reduce(
          async (currentDataWithRelations, [attributeKey, attributeSchema]) => {
            // TODO: handle relations that are inside components
            if (['relation', 'media'].includes(attributeSchema.type)) {
              const attributeValue = entry.data[attributeKey];
              const relationResponse = await buildRelationReponse(
                (Array.isArray(attributeValue)
                  ? attributeValue
                  : [attributeValue]) as EntryToPopulate[],
                attributeSchema
              );

              return {
                ...(await currentDataWithRelations),
                [attributeKey]: relationResponse,
              };
            }

            // Not a media or relation, nothing to change
            return currentDataWithRelations;
          },
          Promise.resolve(entry.data)
        );

        return entryWithRelations;
      };

      const sanitizedResults = await Promise.all(
        (results as HistoryVersionQueryResult[]).map(async (result) => {
          return {
            ...result,
            data: await populateEntryRelations(result),
            meta: {
              unknownAttributes: getSchemaAttributesDiff(
                result.schema,
                strapi.getModel(params.contentType).attributes
              ),
            },
            locale: result.locale ? localeDictionary[result.locale] : null,
            createdBy: result.createdBy
              ? pick(['id', 'firstname', 'lastname', 'username', 'email'], result.createdBy)
              : undefined,
          };
        })
      );

      return {
        results: sanitizedResults,
        pagination,
      };
    },

    async restoreVersion(versionId: Data.ID) {
      const version = await query.findOne({ where: { id: versionId } });
      const contentTypeSchemaAttributes = strapi.getModel(version.contentType).attributes;
      const schemaDiff = getSchemaAttributesDiff(version.schema, contentTypeSchemaAttributes);

      // Set all added attribute values to null
      const dataWithoutAddedAttributes = Object.keys(schemaDiff.added).reduce(
        (currentData, addedKey) => {
          currentData[addedKey] = null;
          return currentData;
        },
        // Clone to avoid mutating the original version data
        structuredClone(version.data)
      );
      const sanitizedSchemaAttributes = omit(
        FIELDS_TO_IGNORE,
        contentTypeSchemaAttributes
      ) as Struct.SchemaAttributes;
      // Set all deleted relation values to null
      const dataWithoutMissingRelations = await Object.entries(sanitizedSchemaAttributes).reduce(
        async (
          previousRelationAttributesPromise: Promise<Record<string, unknown>>,
          [name, attribute]: [string, Schema.Attribute.AnyAttribute]
        ) => {
          const previousRelationAttributes = await previousRelationAttributesPromise;

          const relationData = version.data[name];
          if (relationData === null) {
            return previousRelationAttributes;
          }

          if (
            attribute.type === 'relation' &&
            // TODO: handle polymorphic relations
            attribute.relation !== 'morphToOne' &&
            attribute.relation !== 'morphToMany'
          ) {
            if (Array.isArray(relationData)) {
              if (relationData.length === 0) return previousRelationAttributes;

              const existingAndMissingRelations = await Promise.all(
                relationData.map((relation) => {
                  return strapi.documents(attribute.target).findOne({
                    documentId: relation.documentId,
                    locale: relation.locale || undefined,
                  });
                })
              );
              const existingRelations = existingAndMissingRelations.filter(
                (relation) => relation !== null
              ) as Modules.Documents.AnyDocument[];

              previousRelationAttributes[name] = existingRelations;
            } else {
              const existingRelation = await strapi.documents(attribute.target).findOne({
                documentId: relationData.documentId,
                locale: relationData.locale || undefined,
              });

              if (!existingRelation) {
                previousRelationAttributes[name] = null;
              }
            }
          }

          if (attribute.type === 'media') {
            if (attribute.multiple) {
              const existingAndMissingMedias = await Promise.all(
                // @ts-expect-error Fix the type definitions so this isn't any
                relationData.map((media) => {
                  return strapi.db
                    .query('plugin::upload.file')
                    .findOne({ where: { id: media.id } });
                })
              );

              const existingMedias = existingAndMissingMedias.filter((media) => media != null);
              previousRelationAttributes[name] = existingMedias;
            } else {
              const existingMedia = await strapi.db
                .query('plugin::upload.file')
                .findOne({ where: { id: version.data[name].id } });

              if (!existingMedia) {
                previousRelationAttributes[name] = null;
              }
            }
          }

          return previousRelationAttributes;
        },
        // Clone to avoid mutating the original version data
        Promise.resolve(structuredClone(dataWithoutAddedAttributes))
      );

      const data = omit(['id', ...Object.keys(schemaDiff.removed)], dataWithoutMissingRelations);
      const restoredDocument = await strapi.documents(version.contentType).update({
        documentId: version.relatedDocumentId,
        data,
      });

      if (!restoredDocument) {
        throw new errors.ApplicationError('Failed to restore version');
      }

      return restoredDocument;
    },
  };
};

export { createHistoryService };
