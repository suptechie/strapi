'use strict';

const { getDeepPopulate, getQueryPopulate } = require('../populate');

function populateBuilder(uid) {
  const deepPopulateOptions = {
    countMany: false,
    countOne: false,
    maxLevel: -1,
  };
  let getPopulatePermission;

  const builder = {
    populateRequiredPermissions(permissionChecker, query) {
      getPopulatePermission = async () => {
        const permissionQuery = await permissionChecker.sanitizedQuery.read(query);
        return getQueryPopulate(permissionQuery);
      };
      return builder;
    },
    countRelations({ toMany = false, toOne = false } = {}) {
      deepPopulateOptions.countMany = toMany;
      deepPopulateOptions.countOne = toOne;
      return builder;
    },
    populateDeep(level = Infinity) {
      deepPopulateOptions.maxLevel = level;
      return builder;
    },
    async build() {
      const basePopulate = getPopulatePermission ? await getPopulatePermission() : {};

      if (deepPopulateOptions.maxLevel === -1) {
        return basePopulate;
      }
      return getDeepPopulate(uid, { ...deepPopulateOptions, basePopulate });
    },
  };

  return builder;
}

module.exports = {
  populateBuilder,
};
