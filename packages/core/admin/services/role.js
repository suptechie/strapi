'use strict';

const _ = require('lodash');
const {
  set,
  omit,
  isEqual,
  pick,
  prop,
  isArray,
  isObject,
  mapValues,
  differenceWith,
  differenceBy,
} = require('lodash/fp');
const {
  generateTimestampCode,
  stringIncludes,
  hooks: { createAsyncSeriesWaterfallHook },
} = require('@strapi/utils');
const permissionDomain = require('../domain/permission');
const { validatePermissionsExist } = require('../validation/permission');
const { getService } = require('../utils');
const { SUPER_ADMIN_CODE } = require('./constants');

const hooks = {
  willResetSuperAdminPermissions: createAsyncSeriesWaterfallHook(),
};

const ACTIONS = {
  publish: 'plugins::content-manager.explorer.publish',
};

const sanitizeRole = omit(['users', 'permissions']);

const fieldsToCompare = ['action', 'subject', 'properties', 'conditions'];

const sortDeep = data => {
  if (isArray(data)) {
    return data.slice(0).sort();
  }

  if (isObject(data)) {
    return mapValues(sortDeep, data);
  }

  return data;
};

const sortPermissionProperties = permission => {
  return Object.entries(permission.properties).reduce(
    (acc, [name, value]) => permissionDomain.setProperty(name, sortDeep(value), acc),
    permission
  );
};

const arePermissionsEqual = (p1, p2) => {
  const permissionsFields = [p1, p2]
    // Sort the permissions' properties to remove false negatives
    .map(sortPermissionProperties)
    // Only keep comparison fields
    .map(pick(fieldsToCompare));

  return isEqual(...permissionsFields);
};

/**
 * Create and save a role in database
 * @param attributes A partial role object
 * @returns {Promise<role>}
 */
const create = async attributes => {
  const alreadyExists = await exists({ name: attributes.name });

  if (alreadyExists) {
    throw strapi.errors.badRequest('ValidationError', {
      name: [`The name must be unique and a role with name \`${attributes.name}\` already exists.`],
    });
  }

  const autoGeneratedCode = `${_.kebabCase(attributes.name)}-${generateTimestampCode()}`;

  const rolesWithCode = {
    ...attributes,
    code: attributes.code || autoGeneratedCode,
  };

  return strapi.query('role', 'admin').create(rolesWithCode);
};

/**
 * Find a role in database
 * @param params query params to find the role
 * @param populate
 * @returns {Promise<role>}
 */
const findOne = (params = {}, populate = []) => {
  return strapi.query('role', 'admin').findOne(params, populate);
};

/**
 * Find a role in database with usersCounts
 * @param params query params to find the role
 * @param populate
 * @returns {Promise<role>}
 */
const findOneWithUsersCount = async (params = {}, populate = []) => {
  const role = await strapi.query('role', 'admin').findOne(params, populate);

  if (role) {
    role.usersCount = await getUsersCount(role.id);
  }

  return role;
};

/**
 * Find roles in database
 * @param params query params to find the roles
 * @param populate
 * @returns {Promise<array>}
 */
const find = (params = {}, populate = []) => {
  return strapi.query('role', 'admin').find(params, populate);
};

/**
 * Find all roles in database
 * @returns {Promise<array>}
 */
const findAllWithUsersCount = async (populate = []) => {
  const roles = await strapi.query('role', 'admin').find({ _limit: -1 }, populate);
  for (let role of roles) {
    role.usersCount = await getUsersCount(role.id);
  }

  return roles;
};

/**
 * Update a role in database
 * @param params query params to find the role to update
 * @param attributes A partial role object
 * @returns {Promise<role>}
 */
const update = async (params, attributes) => {
  const sanitizedAttributes = _.omit(attributes, ['code']);

  if (_.has(params, 'id') && _.has(sanitizedAttributes, 'name')) {
    const alreadyExists = await exists({
      name: sanitizedAttributes.name,
      id_ne: params.id,
    });
    if (alreadyExists) {
      throw strapi.errors.badRequest('ValidationError', {
        name: [
          `The name must be unique and a role with name \`${sanitizedAttributes.name}\` already exists.`,
        ],
      });
    }
  }

  return strapi.query('role', 'admin').update(params, sanitizedAttributes);
};

/**
 * Check if a role exists in database
 * @param params query params to find the role
 * @returns {Promise<boolean>}
 */
const exists = async params => {
  const foundCount = await strapi.query('role', 'admin').count(params);

  return foundCount > 0;
};

/**
 * Count the number of roles based on search params
 * @param params params used for the query
 * @returns {Promise<number>}
 */
const count = async (params = {}) => {
  return strapi.query('role', 'admin').count(params);
};

/**
 * Check if the given roles id can be deleted safely, throw otherwise
 * @param ids
 * @returns {Promise<void>}
 */
const checkRolesIdForDeletion = async (ids = []) => {
  const superAdminRole = await getSuperAdmin();

  if (superAdminRole && stringIncludes(ids, superAdminRole.id)) {
    throw new Error('You cannot delete the super admin role');
  }

  for (let roleId of ids) {
    const usersCount = await getUsersCount(roleId);
    if (usersCount !== 0) {
      throw new Error('Some roles are still assigned to some users');
    }
  }
};

/**
 * Delete roles in database if they have no user assigned
 * @param ids query params to find the roles
 * @returns {Promise<array>}
 */
const deleteByIds = async (ids = []) => {
  await checkRolesIdForDeletion(ids);

  await getService('permission').deleteByRolesIds(ids);

  let deletedRoles = await strapi.query('role', 'admin').delete({ id_in: ids });

  if (!Array.isArray(deletedRoles)) {
    deletedRoles = [deletedRoles];
  }

  return deletedRoles;
};

/** Count the number of users for some roles
 * @returns {Promise<number>}
 * @param roleId
 */
const getUsersCount = async roleId => {
  return strapi.query('user', 'admin').count({ roles: [roleId] });
};

/** Returns admin role
 * @returns {Promise<role>}
 */
const getSuperAdmin = () => findOne({ code: SUPER_ADMIN_CODE });

/** Returns admin role with userCount
 * @returns {Promise<role>}
 */
const getSuperAdminWithUsersCount = () => findOneWithUsersCount({ code: SUPER_ADMIN_CODE });

/** Create superAdmin, Author and Editor role is no role already exist
 * @returns {Promise<>}
 */
const createRolesIfNoneExist = async () => {
  const someRolesExist = await exists();
  if (someRolesExist) {
    return;
  }

  const { actionProvider } = getService('permission');

  const allActions = actionProvider.values();
  const contentTypesActions = allActions.filter(a => a.section === 'contentTypes');

  // create 3 roles
  const superAdminRole = await create({
    name: 'Super Admin',
    code: 'strapi-super-admin',
    description: 'Super Admins can access and manage all features and settings.',
  });

  await getService('user').assignARoleToAll(superAdminRole.id);

  const editorRole = await create({
    name: 'Editor',
    code: 'strapi-editor',
    description: 'Editors can manage and publish contents including those of other users.',
  });

  const authorRole = await create({
    name: 'Author',
    code: 'strapi-author',
    description: 'Authors can manage the content they have created.',
  });

  // create content-type permissions for each role
  const editorPermissions = getService('content-type').getPermissionsWithNestedFields(
    contentTypesActions,
    {
      restrictedSubjects: ['plugins::users-permissions.user'],
    }
  );

  const authorPermissions = editorPermissions
    .filter(({ action }) => action !== ACTIONS.publish)
    .map(permission =>
      permissionDomain.create({ ...permission, conditions: ['admin::is-creator'] })
    );

  editorPermissions.push(...getDefaultPluginPermissions());
  authorPermissions.push(...getDefaultPluginPermissions({ isAuthor: true }));

  // assign permissions to roles
  await addPermissions(editorRole.id, editorPermissions);
  await addPermissions(authorRole.id, authorPermissions);
};

const getDefaultPluginPermissions = ({ isAuthor = false } = {}) => {
  const conditions = isAuthor ? ['admin::is-creator'] : [];

  // add plugin permissions for each role
  return [
    { action: 'plugins::upload.read', conditions },
    { action: 'plugins::upload.assets.create' },
    { action: 'plugins::upload.assets.update', conditions },
    { action: 'plugins::upload.assets.download' },
    { action: 'plugins::upload.assets.copy-link' },
  ].map(permissionDomain.create);
};

/** Display a warning if the role superAdmin doesn't exist
 *  or if the role is not assigned to at least one user
 * @returns {Promise<>}
 */
const displayWarningIfNoSuperAdmin = async () => {
  const superAdminRole = await getSuperAdminWithUsersCount();
  const someUsersExists = await getService('user').exists();

  if (!superAdminRole) {
    strapi.log.warn("Your application doesn't have a super admin role.");
  } else if (someUsersExists && superAdminRole.usersCount === 0) {
    strapi.log.warn("Your application doesn't have a super admin user.");
  }
};

/**
 * Assign permissions to a role
 * @param {string|int} roleId - role ID
 * @param {Array<Permission{action,subject,fields,conditions}>} permissions - permissions to assign to the role
 */
const assignPermissions = async (roleId, permissions = []) => {
  try {
    await validatePermissionsExist(permissions);
  } catch (err) {
    throw strapi.errors.badRequest('ValidationError', err);
  }

  const superAdmin = await getService('role').getSuperAdmin();
  const isSuperAdmin = superAdmin && superAdmin.id === roleId;
  const assignRole = set('role', roleId);

  const permissionsWithRole = permissions
    // Add the role attribute to every permission
    .map(assignRole)
    // Transform each permission into a Permission instance
    .map(permissionDomain.create);

  const existingPermissions = await getService('permission').find({
    role: roleId,
    _limit: -1,
  });

  const permissionsToAdd = differenceWith(
    arePermissionsEqual,
    permissionsWithRole,
    existingPermissions
  );
  const permissionsToDelete = differenceWith(
    arePermissionsEqual,
    existingPermissions,
    permissionsWithRole
  );
  const permissionsToReturn = differenceBy('id', permissionsToDelete, existingPermissions);

  if (permissionsToDelete.length > 0) {
    await getService('permission').deleteByIds(permissionsToDelete.map(prop('id')));
  }

  if (permissionsToAdd.length > 0) {
    const createdPermissions = await addPermissions(roleId, permissionsToAdd);
    permissionsToReturn.push(...createdPermissions.map(p => ({ ...p, role: p.role.id })));
  }

  if (!isSuperAdmin && (permissionsToAdd.length || permissionsToDelete.length)) {
    await getService('metrics').sendDidUpdateRolePermissions();
  }

  return permissionsToReturn;
};

const addPermissions = async (roleId, permissions) => {
  const { conditionProvider, createMany } = getService('permission');
  const { sanitizeConditions } = permissionDomain;

  const permissionsWithRole = permissions
    .map(set('role', roleId))
    .map(sanitizeConditions(conditionProvider));

  return createMany(permissionsWithRole);
};

/**
 * Reset super admin permissions (giving it all permissions)
 * @returns {Promise<>}
 */
const resetSuperAdminPermissions = async () => {
  const superAdminRole = await getService('role').getSuperAdmin();
  if (!superAdminRole) {
    return;
  }

  const allActions = getService('permission').actionProvider.values();
  const contentTypesActions = allActions.filter(a => a.section === 'contentTypes');
  const otherActions = allActions.filter(a => a.section !== 'contentTypes');

  // First, get the content-types permissions
  const permissions = getService('content-type').getPermissionsWithNestedFields(
    contentTypesActions
  );

  // Then add every other permission
  const otherPermissions = otherActions.reduce((acc, action) => {
    const { actionId, subjects } = action;

    if (isArray(subjects)) {
      acc.push(...subjects.map(subject => permissionDomain.create({ action: actionId, subject })));
    } else {
      acc.push(permissionDomain.create({ action: actionId }));
    }

    return acc;
  }, []);

  permissions.push(...otherPermissions);

  const transformedPermissions = await hooks.willResetSuperAdminPermissions.call(permissions);

  await assignPermissions(superAdminRole.id, transformedPermissions);
};

/**
 * Check if a user object includes the super admin role
 * @param {object} user
 * @return {boolean}
 */
const hasSuperAdminRole = user => {
  const roles = _.get(user, 'roles', []);

  return roles.map(prop('code')).includes(SUPER_ADMIN_CODE);
};

module.exports = {
  hooks,
  sanitizeRole,
  create,
  findOne,
  findOneWithUsersCount,
  find,
  findAllWithUsersCount,
  update,
  exists,
  count,
  deleteByIds,
  getUsersCount,
  getSuperAdmin,
  getSuperAdminWithUsersCount,
  createRolesIfNoneExist,
  displayWarningIfNoSuperAdmin,
  addPermissions,
  hasSuperAdminRole,
  assignPermissions,
  resetSuperAdminPermissions,
  checkRolesIdForDeletion,
  constants: {
    superAdminCode: SUPER_ADMIN_CODE,
  },
};
