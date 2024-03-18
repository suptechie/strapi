import { setCreatorFields, errors, convertQueryParams } from '@strapi/utils';

import type { Core, Modules, Struct, Internal } from '@strapi/types';

import _ from 'lodash/fp';

import { ALLOWED_WEBHOOK_EVENTS, RELEASE_ACTION_MODEL_UID, RELEASE_MODEL_UID } from '../constants';
import type {
  GetReleases,
  CreateRelease,
  UpdateRelease,
  PublishRelease,
  GetRelease,
  Release,
  DeleteRelease,
  GetContentTypeEntryReleases,
} from '../../../shared/contracts/releases';
import type {
  CreateReleaseAction,
  GetReleaseActions,
  ReleaseAction,
  UpdateReleaseAction,
  DeleteReleaseAction,
  ReleaseActionGroupBy,
} from '../../../shared/contracts/release-actions';
import type { Entity, UserInfo } from '../../../shared/types';
import { getService, getPopulatedEntry, getEntryValidStatus } from '../utils';

export interface Locale extends Entity {
  name: string;
  code: string;
}

type LocaleDictionary = {
  [key: Locale['code']]: Pick<Locale, 'name' | 'code'>;
};

const getGroupName = (queryValue?: ReleaseActionGroupBy) => {
  switch (queryValue) {
    case 'contentType':
      return 'contentType.displayName';
    case 'action':
      return 'type';
    case 'locale':
      return _.getOr('No locale', 'locale.name');
    default:
      return 'contentType.displayName';
  }
};

const createReleaseService = ({ strapi }: { strapi: Core.LoadedStrapi }) => {
  const dispatchWebhook = (
    event: string,
    { isPublished, release, error }: { isPublished: boolean; release?: Release; error?: unknown }
  ) => {
    strapi.eventHub.emit(event, {
      isPublished,
      error,
      release,
    });
  };

  return {
    async create(releaseData: CreateRelease.Request['body'], { user }: { user: UserInfo }) {
      const releaseWithCreatorFields = await setCreatorFields({ user })(releaseData);

      const {
        validatePendingReleasesLimit,
        validateUniqueNameForPendingRelease,
        validateScheduledAtIsLaterThanNow,
      } = getService('release-validation', { strapi });

      await Promise.all([
        validatePendingReleasesLimit(),
        validateUniqueNameForPendingRelease(releaseWithCreatorFields.name),
        validateScheduledAtIsLaterThanNow(releaseWithCreatorFields.scheduledAt),
      ]);

      const release = await strapi.db.query(RELEASE_MODEL_UID).create({
        data: {
          ...releaseWithCreatorFields,
          status: 'empty',
        },
      });

      if (
        strapi.features.future.isEnabled('contentReleasesScheduling') &&
        releaseWithCreatorFields.scheduledAt
      ) {
        const schedulingService = getService('scheduling', { strapi });

        await schedulingService.set(release.id, release.scheduledAt);
      }

      strapi.telemetry.send('didCreateContentRelease');

      return release;
    },

    async findOne(id: GetRelease.Request['params']['id'], query = {}) {
      const dbQuery = convertQueryParams.transformParamsToQuery(RELEASE_MODEL_UID, query);
      const release = await strapi.db.query(RELEASE_MODEL_UID).findOne({
        ...dbQuery,
        where: { id },
      });

      return release;
    },

    findPage(query?: GetReleases.Request['query']) {
      const dbQuery = convertQueryParams.transformParamsToQuery(RELEASE_MODEL_UID, query ?? {});

      return strapi.db.query(RELEASE_MODEL_UID).findPage({
        ...dbQuery,
        populate: {
          actions: {
            count: true,
          },
        },
      });
    },

    async findManyWithContentTypeEntryAttached(
      contentTypeUid: GetContentTypeEntryReleases.Request['query']['contentTypeUid'],
      entryId: GetContentTypeEntryReleases.Request['query']['entryId']
    ) {
      const releases = await strapi.db.query(RELEASE_MODEL_UID).findMany({
        where: {
          actions: {
            target_type: contentTypeUid,
            target_id: entryId,
          },
          releasedAt: {
            $null: true,
          },
        },
        populate: {
          // Filter the action to get only the content type entry
          actions: {
            where: {
              target_type: contentTypeUid,
              target_id: entryId,
            },
          },
        },
      });

      return releases.map((release) => {
        if (release.actions?.length) {
          const [actionForEntry] = release.actions;

          // Remove the actions key to replace it with an action key
          delete release.actions;

          return {
            ...release,
            action: actionForEntry,
          };
        }

        return release;
      });
    },

    async findManyWithoutContentTypeEntryAttached(
      contentTypeUid: GetContentTypeEntryReleases.Request['query']['contentTypeUid'],
      entryId: GetContentTypeEntryReleases.Request['query']['entryId']
    ) {
      // We get the list of releases where the entry is present
      const releasesRelated = await strapi.db.query(RELEASE_MODEL_UID).findMany({
        where: {
          releasedAt: {
            $null: true,
          },
          actions: {
            target_type: contentTypeUid,
            target_id: entryId,
          },
        },
      });

      const releases = await strapi.db.query(RELEASE_MODEL_UID).findMany({
        where: {
          $or: [
            {
              id: {
                $notIn: releasesRelated.map((release) => release.id),
              },
            },
            {
              actions: null,
            },
          ],
          releasedAt: {
            $null: true,
          },
        },
      });

      return releases.map((release) => {
        if (release.actions?.length) {
          const [actionForEntry] = release.actions;

          // Remove the actions key to replace it with an action key
          delete release.actions;

          return {
            ...release,
            action: actionForEntry,
          };
        }

        return release;
      });
    },

    async update(
      id: number,
      releaseData: UpdateRelease.Request['body'],
      { user }: { user: UserInfo }
    ) {
      const releaseWithCreatorFields = await setCreatorFields({ user, isEdition: true })(
        releaseData
      );

      const { validateUniqueNameForPendingRelease, validateScheduledAtIsLaterThanNow } = getService(
        'release-validation',
        { strapi }
      );

      await Promise.all([
        validateUniqueNameForPendingRelease(releaseWithCreatorFields.name, id),
        validateScheduledAtIsLaterThanNow(releaseWithCreatorFields.scheduledAt),
      ]);

      const release = await strapi.db.query(RELEASE_MODEL_UID).findOne({ where: { id } });

      if (!release) {
        throw new errors.NotFoundError(`No release found for id ${id}`);
      }

      if (release.releasedAt) {
        throw new errors.ValidationError('Release already published');
      }

      const updatedRelease = await strapi.db.query(RELEASE_MODEL_UID).update({
        where: { id },
        data: releaseWithCreatorFields,
      });

      if (strapi.features.future.isEnabled('contentReleasesScheduling')) {
        const schedulingService = getService('scheduling', { strapi });

        if (releaseData.scheduledAt) {
          // set function always cancel the previous job if it exists, so we can call it directly
          await schedulingService.set(id, releaseData.scheduledAt);
        } else if (release.scheduledAt) {
          // When user don't send a scheduledAt and we have one on the release, means that user want to unschedule it
          schedulingService.cancel(id);
        }
      }

      this.updateReleaseStatus(id);

      strapi.telemetry.send('didUpdateContentRelease');

      return updatedRelease;
    },

    async createAction(
      releaseId: CreateReleaseAction.Request['params']['releaseId'],
      action: Pick<CreateReleaseAction.Request['body'], 'type' | 'entry'>
    ) {
      const { validateEntryContentType, validateUniqueEntry } = getService('release-validation', {
        strapi,
      });

      await Promise.all([
        validateEntryContentType(action.entry.contentType),
        validateUniqueEntry(releaseId, action),
      ]);

      const release = await strapi.db
        .query(RELEASE_MODEL_UID)
        .findOne({ where: { id: releaseId } });

      if (!release) {
        throw new errors.NotFoundError(`No release found for id ${releaseId}`);
      }

      if (release.releasedAt) {
        throw new errors.ValidationError('Release already published');
      }

      const { entry, type } = action;

      const populatedEntry = await getPopulatedEntry(entry.contentType, entry.id, { strapi });
      const isEntryValid = await getEntryValidStatus(entry.contentType, populatedEntry, { strapi });

      const releaseAction = await strapi.db.query(RELEASE_ACTION_MODEL_UID).create({
        data: {
          type,
          contentType: entry.contentType,
          locale: entry.locale,
          isEntryValid,
          entry: {
            id: entry.id,
            __type: entry.contentType,
            __pivot: { field: 'entry' },
          },
          release: releaseId,
        },
        populate: { release: { select: ['id'] }, entry: { select: ['id'] } },
      });

      this.updateReleaseStatus(releaseId);

      return releaseAction;
    },

    async findActions(
      releaseId: GetReleaseActions.Request['params']['releaseId'],
      query?: GetReleaseActions.Request['query']
    ) {
      const release = await strapi.db.query(RELEASE_MODEL_UID).findOne({
        where: { id: releaseId },
        select: ['id'],
      });

      if (!release) {
        throw new errors.NotFoundError(`No release found for id ${releaseId}`);
      }

      const dbQuery = convertQueryParams.transformParamsToQuery(
        RELEASE_ACTION_MODEL_UID,
        query ?? {}
      );

      return strapi.db.query(RELEASE_ACTION_MODEL_UID).findPage({
        ...dbQuery,
        populate: {
          entry: {
            populate: '*',
          },
        },
        where: {
          release: releaseId,
        },
      });
    },

    async countActions(
      query: Modules.EntityService.Params.Pick<typeof RELEASE_ACTION_MODEL_UID, 'filters'>
    ) {
      const dbQuery = convertQueryParams.transformParamsToQuery(
        RELEASE_ACTION_MODEL_UID,
        query ?? {}
      );

      return strapi.db.query(RELEASE_ACTION_MODEL_UID).count(dbQuery);
    },

    async groupActions(actions: ReleaseAction[], groupBy: ReleaseActionGroupBy) {
      const contentTypeUids = actions.reduce<ReleaseAction['contentType'][]>((acc, action) => {
        if (!acc.includes(action.contentType)) {
          acc.push(action.contentType);
        }

        return acc;
      }, []);
      const allReleaseContentTypesDictionary = await this.getContentTypesDataForActions(
        contentTypeUids
      );
      const allLocalesDictionary = await this.getLocalesDataForActions();

      const formattedData = actions.map((action: ReleaseAction) => {
        const { mainField, displayName } = allReleaseContentTypesDictionary[action.contentType];

        return {
          ...action,
          locale: action.locale ? allLocalesDictionary[action.locale] : null,
          contentType: {
            displayName,
            mainFieldValue: action.entry[mainField],
            uid: action.contentType,
          },
        };
      });

      const groupName = getGroupName(groupBy);
      return _.groupBy(groupName)(formattedData);
    },

    async getLocalesDataForActions() {
      if (!strapi.plugin('i18n')) {
        return {};
      }

      const allLocales: Locale[] = (await strapi.plugin('i18n').service('locales').find()) || [];
      return allLocales.reduce<LocaleDictionary>((acc, locale) => {
        acc[locale.code] = { name: locale.name, code: locale.code };

        return acc;
      }, {});
    },

    async getContentTypesDataForActions(contentTypesUids: ReleaseAction['contentType'][]) {
      const contentManagerContentTypeService = strapi
        .plugin('content-manager')
        .service('content-types');

      const contentTypesData: Record<
        Internal.UID.ContentType,
        { mainField: string; displayName: string }
      > = {};
      for (const contentTypeUid of contentTypesUids) {
        const contentTypeConfig = await contentManagerContentTypeService.findConfiguration({
          uid: contentTypeUid,
        });

        contentTypesData[contentTypeUid] = {
          mainField: contentTypeConfig.settings.mainField,
          displayName: strapi.getModel(contentTypeUid).info.displayName,
        };
      }

      return contentTypesData;
    },

    getContentTypeModelsFromActions(actions: ReleaseAction[]) {
      const contentTypeUids = actions.reduce<ReleaseAction['contentType'][]>((acc, action) => {
        if (!acc.includes(action.contentType)) {
          acc.push(action.contentType);
        }

        return acc;
      }, []);

      const contentTypeModelsMap = contentTypeUids.reduce(
        (
          acc: { [key: ReleaseAction['contentType']]: Struct.ContentTypeSchema },
          contentTypeUid: ReleaseAction['contentType']
        ) => {
          acc[contentTypeUid] = strapi.getModel(contentTypeUid);

          return acc;
        },
        {}
      );

      return contentTypeModelsMap;
    },

    async getAllComponents() {
      const contentManagerComponentsService = strapi
        .plugin('content-manager')
        .service('components');

      const components = await contentManagerComponentsService.findAllComponents();

      const componentsMap = components.reduce(
        (
          acc: { [key: Struct.ComponentSchema['uid']]: Struct.ComponentSchema },
          component: Struct.ComponentSchema
        ) => {
          acc[component.uid] = component;

          return acc;
        },
        {}
      );

      return componentsMap;
    },

    async delete(releaseId: DeleteRelease.Request['params']['id']) {
      const release: Release = await strapi.db.query(RELEASE_MODEL_UID).findOne({
        where: { id: releaseId },
        populate: {
          actions: {
            select: ['id'],
          },
        },
      });

      if (!release) {
        throw new errors.NotFoundError(`No release found for id ${releaseId}`);
      }

      if (release.releasedAt) {
        throw new errors.ValidationError('Release already published');
      }

      // Only delete the release and its actions is you in fact can delete all the actions and the release
      // Otherwise, if the transaction fails it throws an error
      await strapi.db.transaction(async () => {
        await strapi.db.query(RELEASE_ACTION_MODEL_UID).deleteMany({
          where: {
            id: {
              $in: release.actions.map((action) => action.id),
            },
          },
        });

        await strapi.db.query(RELEASE_MODEL_UID).delete({
          where: {
            id: releaseId,
          },
        });
      });

      if (strapi.features.future.isEnabled('contentReleasesScheduling') && release.scheduledAt) {
        const schedulingService = getService('scheduling', { strapi });
        await schedulingService.cancel(release.id);
      }

      strapi.telemetry.send('didDeleteContentRelease');

      return release;
    },

    async publish(releaseId: PublishRelease.Request['params']['id']) {
      try {
        // We need to pass the type because entityService.findOne is not returning the correct type
        const releaseWithPopulatedActionEntries: Release = await strapi.db
          .query(RELEASE_MODEL_UID)
          .findOne({
            where: { id: releaseId },
            populate: {
              actions: {
                populate: {
                  entry: {
                    select: ['id'],
                  },
                },
              },
            },
          });

        if (!releaseWithPopulatedActionEntries) {
          throw new errors.NotFoundError(`No release found for id ${releaseId}`);
        }

        if (releaseWithPopulatedActionEntries.releasedAt) {
          throw new errors.ValidationError('Release already published');
        }

        if (releaseWithPopulatedActionEntries.actions.length === 0) {
          throw new errors.ValidationError('No entries to publish');
        }

        /**
         * We separate publish and unpublish actions, grouping them by contentType and extracting only their IDs. Then we can fetch more data for each entry
         * We need to separate collectionTypes from singleTypes because findMany work as findOne for singleTypes and publishMany can't be used for singleTypes
         */
        const collectionTypeActions: {
          [key: Internal.UID.ContentType]: {
            entriestoPublishIds: ReleaseAction['entry']['id'][];
            entriesToUnpublishIds: ReleaseAction['entry']['id'][];
          };
        } = {};
        const singleTypeActions: {
          uid: Internal.UID.ContentType;
          id: ReleaseAction['entry']['id'];
          action: ReleaseAction['type'];
        }[] = [];
        for (const action of releaseWithPopulatedActionEntries.actions) {
          const contentTypeUid = action.contentType;

          if (strapi.contentTypes[contentTypeUid].kind === 'collectionType') {
            if (!collectionTypeActions[contentTypeUid]) {
              collectionTypeActions[contentTypeUid] = {
                entriestoPublishIds: [],
                entriesToUnpublishIds: [],
              };
            }

            if (action.type === 'publish') {
              collectionTypeActions[contentTypeUid].entriestoPublishIds.push(action.entry.id);
            } else {
              collectionTypeActions[contentTypeUid].entriesToUnpublishIds.push(action.entry.id);
            }
          } else {
            singleTypeActions.push({
              uid: contentTypeUid,
              action: action.type,
              id: action.entry.id,
            });
          }
        }

        const entityManagerService = strapi.plugin('content-manager').service('entity-manager');
        const populateBuilderService = strapi.plugin('content-manager').service('populate-builder');

        // Only publish the release if all action updates are applied successfully to their entry, otherwise leave everything as is
        await strapi.db.transaction(async () => {
          // First we publish all the singleTypes
          for (const { uid, action, id } of singleTypeActions) {
            // @ts-expect-error - populateBuilderService should be a function but is returning service
            const populate = await populateBuilderService(uid).populateDeep(Infinity).build();

            const entry = await strapi.db.query(uid).findOne({ where: { id }, populate });

            try {
              if (action === 'publish') {
                await entityManagerService.publish(entry, uid);
              } else {
                await entityManagerService.unpublish(entry, uid);
              }
            } catch (error) {
              if (
                error instanceof errors.ApplicationError &&
                (error.message === 'already.published' || error.message === 'already.draft')
              ) {
                // We don't want throw an error if the entry is already published or draft
              } else {
                throw error;
              }
            }
          }

          // Then, we can continue with publishing the collectionTypes
          for (const contentTypeUid of Object.keys(collectionTypeActions)) {
            // @ts-expect-error - populateBuilderService should be a function but is returning service
            const populate = await populateBuilderService(contentTypeUid)
              .populateDeep(Infinity)
              .build();

            const { entriestoPublishIds, entriesToUnpublishIds } =
              collectionTypeActions[contentTypeUid as Internal.UID.ContentType];

            /**
             * We need to get the populate entries to be able to publish without errors on components/relations/dynamicZones
             * Considering that populate doesn't work well with morph relations we can't get the entries from the Release model
             * So, we need to fetch them manually
             */
            const entriesToPublish: Entity[] = await strapi.db.query(contentTypeUid).findMany({
              where: {
                id: {
                  $in: entriestoPublishIds,
                },
              },
              populate,
            });

            const entriesToUnpublish: Entity[] = await strapi.db.query(contentTypeUid).findMany({
              where: {
                id: {
                  $in: entriesToUnpublishIds,
                },
              },
              populate,
            });

            if (entriesToPublish.length > 0) {
              await entityManagerService.publishMany(entriesToPublish, contentTypeUid);
            }

            if (entriesToUnpublish.length > 0) {
              await entityManagerService.unpublishMany(entriesToUnpublish, contentTypeUid);
            }
          }
        });

        // When the transaction fails it throws an error, when it is successful proceed to updating the release
        const release = (await strapi.db.query(RELEASE_MODEL_UID).update({
          where: { id: releaseId },
          data: {
            releasedAt: new Date(),
          },
          populate: {
            actions: {
              count: true,
            },
          },
        })) as Release;

        if (strapi.features.future.isEnabled('contentReleasesScheduling')) {
          dispatchWebhook(ALLOWED_WEBHOOK_EVENTS.RELEASES_PUBLISH, {
            isPublished: true,
            release,
          });
        }

        strapi.telemetry.send('didPublishContentRelease');

        return release;
      } catch (error) {
        if (strapi.features.future.isEnabled('contentReleasesScheduling')) {
          dispatchWebhook(ALLOWED_WEBHOOK_EVENTS.RELEASES_PUBLISH, {
            isPublished: false,
            error,
          });
        }

        // If transaction failed, change release status to failed
        strapi.db.query(RELEASE_MODEL_UID).update({
          where: { id: releaseId },
          data: {
            status: 'failed',
          },
        });

        throw error;
      }
    },

    async updateAction(
      actionId: UpdateReleaseAction.Request['params']['actionId'],
      releaseId: UpdateReleaseAction.Request['params']['releaseId'],
      update: UpdateReleaseAction.Request['body']
    ) {
      const updatedAction = await strapi.db.query(RELEASE_ACTION_MODEL_UID).update({
        where: {
          id: actionId,
          release: {
            id: releaseId,
            releasedAt: {
              $null: true,
            },
          },
        },
        data: update,
      });

      if (!updatedAction) {
        throw new errors.NotFoundError(
          `Action with id ${actionId} not found in release with id ${releaseId} or it is already published`
        );
      }

      return updatedAction;
    },

    async deleteAction(
      actionId: DeleteReleaseAction.Request['params']['actionId'],
      releaseId: DeleteReleaseAction.Request['params']['releaseId']
    ) {
      const deletedAction = await strapi.db.query(RELEASE_ACTION_MODEL_UID).delete({
        where: {
          id: actionId,
          release: {
            id: releaseId,
            releasedAt: {
              $null: true,
            },
          },
        },
      });

      if (!deletedAction) {
        throw new errors.NotFoundError(
          `Action with id ${actionId} not found in release with id ${releaseId} or it is already published`
        );
      }

      this.updateReleaseStatus(releaseId);

      return deletedAction;
    },

    async updateReleaseStatus(releaseId: Release['id']) {
      const [totalActions, invalidActions] = await Promise.all([
        this.countActions({
          filters: {
            release: releaseId,
          },
        }),
        this.countActions({
          filters: {
            release: releaseId,
            isEntryValid: false,
          },
        }),
      ]);

      if (totalActions > 0) {
        if (invalidActions > 0) {
          return strapi.db.query(RELEASE_MODEL_UID).update({
            where: {
              id: releaseId,
            },
            data: {
              status: 'blocked',
            },
          });
        }

        return strapi.db.query(RELEASE_MODEL_UID).update({
          where: {
            id: releaseId,
          },
          data: {
            status: 'ready',
          },
        });
      }

      return strapi.db.query(RELEASE_MODEL_UID).update({
        where: {
          id: releaseId,
        },
        data: {
          status: 'empty',
        },
      });
    },
  };
};

export default createReleaseService;
