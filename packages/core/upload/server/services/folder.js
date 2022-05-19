'use strict';

const uuid = require('uuid').v4;
const { keys, sortBy, omit, map, isUndefined } = require('lodash/fp');
const { joinBy, setCreatorFields } = require('@strapi/utils');
const { FOLDER_MODEL_UID, FILE_MODEL_UID } = require('../constants');
const { getService } = require('../utils');

const generateUID = () => uuid();

const setPathAndUID = async folder => {
  const uid = generateUID();
  let parentPath = '/';
  if (folder.parent) {
    const parentFolder = await strapi.entityService.findOne(FOLDER_MODEL_UID, folder.parent);
    parentPath = parentFolder.path;
  }

  return Object.assign(folder, {
    uid,
    path: joinBy('/', parentPath, uid),
  });
};

const create = async (folderData, { user } = {}) => {
  const folderService = getService('folder');

  // TODO: wrap with a transaction
  let enrichedFolder = await folderService.setPathAndUID(folderData);
  if (user) {
    enrichedFolder = await setCreatorFields({ user })(enrichedFolder);
  }

  const folder = await strapi.entityService.create(FOLDER_MODEL_UID, { data: enrichedFolder });

  return folder;
};

/**
 * Recursively delete folders and included files
 * @param ids ids of the folders to delete
 * @returns {Promise<Object[]>}
 */
const deleteByIds = async (ids = []) => {
  const folders = await strapi.db.query(FOLDER_MODEL_UID).findMany({ where: { id: { $in: ids } } });
  if (folders.length === 0) {
    return [];
  }

  const pathsToDelete = map('path', folders);

  // delete files
  const filesToDelete = await strapi.db.query(FILE_MODEL_UID).findMany({
    where: {
      $or: pathsToDelete.map(path => ({ folderPath: { $startsWith: path } })),
    },
  });

  await Promise.all(filesToDelete.map(file => getService('upload').remove(file)));

  // delete folders
  await strapi.db.query(FOLDER_MODEL_UID).deleteMany({
    where: {
      $or: pathsToDelete.map(path => ({ path: { $startsWith: path } })),
    },
  });

  return folders;
};

/**
 * Update name and location of a folder and its belonging folders and files
 * @param params query params to find the folder
 * @returns {Promise<boolean>}
 */
const update = async (id, { name, parent }, { user }) => {
  const existingFolder = await strapi.entityService.findOne(FOLDER_MODEL_UID, id);

  if (!existingFolder) {
    return undefined;
  }

  if (!isUndefined(parent)) {
    const folderPathColumnName = strapi.db.metadata.get(FILE_MODEL_UID).attributes.folderPath
      .columnName;
    const pathColumnName = strapi.db.metadata.get(FOLDER_MODEL_UID).attributes.path.columnName;

    // Todo wrap into a transaction
    const destinationFolder =
      parent === null ? '/' : (await strapi.entityService.findOne(FOLDER_MODEL_UID, parent)).path;

    const folderTable = strapi.getModel(FOLDER_MODEL_UID).collectionName;
    const fileTable = strapi.getModel(FILE_MODEL_UID).collectionName;

    await strapi.db
      .connection(folderTable)
      .where(pathColumnName, 'like', `${existingFolder.path}%`)
      .update(
        pathColumnName,
        strapi.db.connection.raw('REPLACE(??, ?, ?)', [
          pathColumnName,
          existingFolder.path,
          joinBy('/', destinationFolder, existingFolder.uid),
        ])
      );

    await strapi.db
      .connection(fileTable)
      .where(folderPathColumnName, 'like', `${existingFolder.path}%`)
      .update(
        folderPathColumnName,
        strapi.db.connection.raw('REPLACE(??, ?, ?)', [
          folderPathColumnName,
          existingFolder.path,
          joinBy('/', destinationFolder, existingFolder.uid),
        ])
      );
  }

  const newFolder = setCreatorFields({ user, isEdition: true })({ name, parent });
  const folder = await strapi.entityService.update(FOLDER_MODEL_UID, id, { data: newFolder });

  return folder;
};

/**
 * Check if a folder exists in database
 * @param params query params to find the folder
 * @returns {Promise<boolean>}
 */
const exists = async (params = {}) => {
  const count = await strapi.query(FOLDER_MODEL_UID).count({ where: params });
  return count > 0;
};

/**
 * Returns the nested structure of folders
 * @returns {Promise<array>}
 */
const getStructure = async () => {
  const joinTable = strapi.db.metadata.get(FOLDER_MODEL_UID).attributes.parent.joinTable;
  const qb = strapi.db.queryBuilder(FOLDER_MODEL_UID);
  const alias = qb.getAlias();
  const folders = await qb
    .select(['id', 'name', `${alias}.${joinTable.inverseJoinColumn.name} as parent`])
    .join({
      alias,
      referencedTable: joinTable.name,
      referencedColumn: joinTable.joinColumn.name,
      rootColumn: joinTable.joinColumn.referencedColumn,
      rootTable: qb.alias,
    })
    .execute({ mapResults: false });

  const folderMap = folders.reduce((map, f) => {
    f.children = [];
    map[f.id] = f;
    return map;
  }, {});
  folderMap.null = { children: [] };

  for (const id of keys(omit('null', folderMap))) {
    const parentId = folderMap[id].parent;
    folderMap[parentId].children.push(folderMap[id]);
    folderMap[parentId].children = sortBy('name', folderMap[parentId].children);
    delete folderMap[id].parent;
  }

  return folderMap.null.children;
};

module.exports = {
  create,
  exists,
  deleteByIds,
  update,
  setPathAndUID,
  getStructure,
};
