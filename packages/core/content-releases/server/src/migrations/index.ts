import type { Schema, Common } from '@strapi/types';
import { mapAsync } from '@strapi/utils';
import isEqual from 'lodash/isEqual';

import { difference, keys } from 'lodash';
import { RELEASE_ACTION_MODEL_UID, RELEASE_MODEL_UID } from '../constants';
import { getPopulatedEntry, getEntryValidStatus, getService } from '../utils';
import { Release } from '../../../shared/contracts/releases';
import { ReleaseAction } from '../../../shared/contracts/release-actions';

interface Input {
  oldContentTypes: Record<string, Schema.ContentType>;
  contentTypes: Record<string, Schema.ContentType>;
}

export async function deleteActionsOnDeleteContentType({ oldContentTypes, contentTypes }: Input) {
  const deletedContentTypes = difference(keys(oldContentTypes), keys(contentTypes)) ?? [];

  if (deletedContentTypes.length) {
    await mapAsync(deletedContentTypes, async (deletedContentTypeUID: unknown) => {
      return strapi.db
        ?.queryBuilder(RELEASE_ACTION_MODEL_UID)
        .delete()
        .where({ contentType: deletedContentTypeUID })
        .execute();
    });
  }
}

export async function migrateIsValidAndStatusReleases() {
  const releasesWithoutStatus = (await strapi.db.query(RELEASE_MODEL_UID).findMany({
    where: {
      status: null,
      releasedAt: null,
    },
    populate: {
      actions: {
        populate: {
          entry: true,
        },
      },
    },
  })) as Release[];

  mapAsync(releasesWithoutStatus, async (release: Release) => {
    const actions = release.actions;

    const notValidatedActions = actions.filter((action) => action.isEntryValid === null);

    for (const action of notValidatedActions) {
      // We need to check the Action is related to a valid entry because we can't assume this is gonna be always the case
      // example: users could make changes directly to their database, or data could be lost
      if (action.entry) {
        const populatedEntry = await getPopulatedEntry(action.contentType, action.entry.id, {
          strapi,
        });

        if (populatedEntry) {
          const isEntryValid = getEntryValidStatus(action.contentType, populatedEntry, { strapi });

          await strapi.db.query(RELEASE_ACTION_MODEL_UID).update({
            where: {
              id: action.id,
            },
            data: {
              isEntryValid,
            },
          });
        }
      }
    }

    return getService('release', { strapi }).updateReleaseStatus(release.id);
  });

  const publishedReleases = await strapi.db.query(RELEASE_MODEL_UID).findMany({
    where: {
      status: null,
      releasedAt: {
        $notNull: true,
      },
    },
  });

  mapAsync(publishedReleases, async (release: Release) => {
    return strapi.db.query(RELEASE_MODEL_UID).update({
      where: {
        id: release.id,
      },
      data: {
        status: 'done',
      },
    });
  });
}

export async function revalidateChangedContentTypes({ oldContentTypes, contentTypes }: Input) {
  if (oldContentTypes !== undefined && contentTypes !== undefined) {
    const contentTypesWithDraftAndPublish = Object.keys(oldContentTypes);
    const releasesAffected = new Set();

    mapAsync(contentTypesWithDraftAndPublish, async (contentTypeUID: Common.UID.ContentType) => {
      const oldContentType = oldContentTypes[contentTypeUID];
      const contentType = contentTypes[contentTypeUID];

      // If attributes have changed, we need to revalidate actions because maybe validations rules are different
      if (!isEqual(oldContentType?.attributes, contentType?.attributes)) {
        const actions = await strapi.db.query(RELEASE_ACTION_MODEL_UID).findMany({
          where: {
            contentType: contentTypeUID,
          },
          populate: {
            entry: true,
            release: true,
          },
        });

        await mapAsync(actions, async (action: ReleaseAction) => {
          if (action.entry) {
            const populatedEntry = await getPopulatedEntry(contentTypeUID, action.entry.id, {
              strapi,
            });

            if (populatedEntry) {
              const isEntryValid = await getEntryValidStatus(contentTypeUID, populatedEntry, {
                strapi,
              });

              releasesAffected.add(action.release.id);

              await strapi.db.query(RELEASE_ACTION_MODEL_UID).update({
                where: {
                  id: action.id,
                },
                data: {
                  isEntryValid,
                },
              });
            }
          }
        });
      }
    }).then(() => {
      // We need to update the status of the releases affected
      mapAsync(releasesAffected, async (releaseId: Release['id']) => {
        return getService('release', { strapi }).updateReleaseStatus(releaseId);
      });
    });
  }
}
