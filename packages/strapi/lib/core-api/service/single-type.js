'use strict';

/**
 * Returns a single type service to handle default core-api actions
 */
const createSingleTypeService = ({ model, strapi, utils }) => {
  const { modelName } = model;
  const { sanitizeInput, getFetchParams } = utils;

  return {
    /**
     * Returns single type content
     *
     * @return {Promise}
     */
    find(params, populate) {
      return strapi.entityService.find(
        { params: getFetchParams(params), populate },
        { model: modelName }
      );
    },

    /**
     * Creates or update the single- type content
     *
     * @return {Promise}
     */
    async createOrUpdate(data, { files, query } = {}) {
      const entity = await this.find(query);
      const sanitizedData = sanitizeInput(data);

      if (!entity) {
        const count = await strapi.query(modelName).count();
        if (count >= 1) {
          throw strapi.errors.badRequest('singleType.alreadyExists');
        }

        return strapi.entityService.create({ data: sanitizedData, files }, { model: modelName });
      } else {
        return strapi.entityService.update(
          {
            params: {
              id: entity.id,
            },
            data: sanitizedData,
            files,
          },
          { model: modelName }
        );
      }
    },

    /**
     * Deletes the single type content
     *
     * @return {Promise}
     */
    async delete() {
      const entity = await this.find();

      if (!entity) return;

      return strapi.entityService.delete({ params: { id: entity.id } }, { model: modelName });
    },
  };
};

module.exports = createSingleTypeService;
