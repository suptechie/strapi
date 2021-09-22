'use strict';

const { hasDraftAndPublish } = require('@strapi/utils').contentTypes;

const enableDraftAndPublish = async ({ oldContentTypes, contentTypes }) => {
  if (!oldContentTypes) {
    return;
  }
  // run the after content types migrations

  for (const uid in contentTypes) {
    if (!oldContentTypes[uid]) {
      continue;
    }

    const oldContentType = oldContentTypes[uid];
    const contentType = contentTypes[uid];

    // if d&p was enabled set publishedAt to eq created_at
    if (!hasDraftAndPublish(oldContentType) && hasDraftAndPublish(contentType)) {
      const qb = strapi.db.queryBuilder(uid);
      await qb
        .update({ publishedAt: qb.ref('createdAt') })
        .where({ publishedAt: null })
        .execute();
    }
  }
};

const disableDraftAndPublish = async ({ oldContentTypes, contentTypes }) => {
  if (!oldContentTypes) {
    return;
  }

  for (const uid in contentTypes) {
    if (!oldContentTypes[uid]) {
      continue;
    }

    const oldContentType = oldContentTypes[uid];
    const contentType = contentTypes[uid];

    // if d&p was disabled remove unpublish content before sync
    if (hasDraftAndPublish(oldContentType) && !hasDraftAndPublish(contentType)) {
      await strapi.db
        .queryBuilder(uid)
        .delete()
        .where({ publishedAt: null })
        .execute();
    }
  }
};

module.exports = {
  enable: enableDraftAndPublish,
  disable: disableDraftAndPublish,
};
