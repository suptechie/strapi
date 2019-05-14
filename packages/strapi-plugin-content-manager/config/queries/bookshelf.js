const _ = require('lodash');
const { convertRestQueryParams, buildQuery } = require('strapi-utils');

module.exports = ({ model }) => ({
  find(params, populate, raw = false) {
    const filters = convertRestQueryParams(params);

    return model
      .query(buildQuery({ model, filters }))
      .fetchAll({
        withRelated: populate || model.associations.map(x => x.alias),
      })
      .then(data => (raw ? data.toJSON() : data));
  },

  count(params = {}) {
    const { where } = convertRestQueryParams(params);

    return model.query(buildQuery({ model, filters: { where } })).count();
  },

  search(params, populate, raw = false) {
    const associations = model.associations.map(x => x.alias);
    const searchText = Object.keys(model._attributes)
      .filter(
        attribute =>
          attribute !== model.primaryKey && !associations.includes(attribute)
      )
      .filter(attribute =>
        ['string', 'text'].includes(model._attributes[attribute].type)
      );

    const searchInt = Object.keys(model._attributes)
      .filter(
        attribute =>
          attribute !== model.primaryKey && !associations.includes(attribute)
      )
      .filter(attribute =>
        ['integer', 'biginteger', 'decimal', 'float'].includes(
          model._attributes[attribute].type
        )
      );

    const searchBool = Object.keys(model._attributes)
      .filter(
        attribute =>
          attribute !== model.primaryKey && !associations.includes(attribute)
      )
      .filter(attribute =>
        ['boolean'].includes(model._attributes[attribute].type)
      );

    const query = (params.search || '').replace(/[^a-zA-Z0-9.-\s]+/g, '');

    return model
      .query(qb => {
        if (!_.isNaN(_.toNumber(query))) {
          searchInt.forEach(attribute => {
            qb.orWhereRaw(`${attribute} = ${_.toNumber(query)}`);
          });
        }

        if (query === 'true' || query === 'false') {
          searchBool.forEach(attribute => {
            qb.orWhereRaw(`${attribute} = ${_.toNumber(query === 'true')}`);
          });
        }

        // Search in columns with text using index.
        switch (model.client) {
          case 'mysql':
            qb.orWhereRaw(
              `MATCH(${searchText.join(',')}) AGAINST(? IN BOOLEAN MODE)`,
              `*${query}*`
            );
            break;
          case 'pg': {
            const searchQuery = searchText.map(attribute =>
              _.toLower(attribute) === attribute
                ? `to_tsvector(${attribute})`
                : `to_tsvector('${attribute}')`
            );

            qb.orWhereRaw(
              `${searchQuery.join(' || ')} @@ to_tsquery(?)`,
              query
            );
            break;
          }
          case 'sqlite3':
            searchText.map(attribute => {
              qb.orWhere(`${attribute}`, 'LIKE', `%${query}%`);
            });
        }

        if (params.sort) {
          qb.orderBy(params.sort.key, params.sort.order);
        }

        if (params.skip) {
          qb.offset(_.toNumber(params.skip));
        }

        if (params.limit) {
          qb.limit(_.toNumber(params.limit));
        }
      })
      .fetchAll({
        withRelated: populate || associations,
      })
      .then(data => (raw ? data.toJSON() : data));
  },

  countSearch(params = {}) {
    const associations = model.associations.map(x => x.alias);
    const searchText = Object.keys(model._attributes)
      .filter(
        attribute =>
          attribute !== model.primaryKey && !associations.includes(attribute)
      )
      .filter(attribute =>
        ['string', 'text'].includes(model._attributes[attribute].type)
      );

    const searchInt = Object.keys(model._attributes)
      .filter(
        attribute =>
          attribute !== model.primaryKey && !associations.includes(attribute)
      )
      .filter(attribute =>
        ['integer', 'biginteger', 'decimal', 'float'].includes(
          model._attributes[attribute].type
        )
      );

    const searchBool = Object.keys(model._attributes)
      .filter(
        attribute =>
          attribute !== model.primaryKey && !associations.includes(attribute)
      )
      .filter(attribute =>
        ['boolean'].includes(model._attributes[attribute].type)
      );

    const query = (params.search || '').replace(/[^a-zA-Z0-9.-\s]+/g, '');

    return model
      .query(qb => {
        if (!_.isNaN(_.toNumber(query))) {
          searchInt.forEach(attribute => {
            qb.orWhereRaw(`${attribute} = ${_.toNumber(query)}`);
          });
        }

        if (query === 'true' || query === 'false') {
          searchBool.forEach(attribute => {
            qb.orWhereRaw(`${attribute} = ${_.toNumber(query === 'true')}`);
          });
        }

        // Search in columns with text using index.
        switch (model.client) {
          case 'pg': {
            const searchQuery = searchText.map(attribute =>
              _.toLower(attribute) === attribute
                ? `to_tsvector(${attribute})`
                : `to_tsvector('${attribute}')`
            );

            qb.orWhereRaw(
              `${searchQuery.join(' || ')} @@ to_tsquery(?)`,
              query
            );
            break;
          }
          case 'mysql':
            qb.orWhereRaw(
              `MATCH(${searchText.join(',')}) AGAINST(? IN BOOLEAN MODE)`,
              `*${query}*`
            );
            break;
        }
      })
      .count();
  },

  findOne: async function(params, populate) {
    const record = await model
      .forge({
        [model.primaryKey]: params[model.primaryKey],
      })
      .fetch({
        withRelated: populate || model.associations.map(x => x.alias),
      });

    const data = _.get(record, 'toJSON()', record);

    // Retrieve data manually.
    if (_.isEmpty(populate)) {
      const arrayOfPromises = model.associations
        .filter(association =>
          ['manyMorphToOne', 'manyMorphToMany'].includes(association.nature)
        )
        .map(() => {
          return model.morph
            .forge()
            .where({
              [`${model.collectionName}_id`]: params[model.primaryKey],
            })
            .fetchAll();
        });

      const related = await Promise.all(arrayOfPromises);

      related.forEach((value, index) => {
        data[model.associations[index].alias] = value ? value.toJSON() : value;
      });
    }

    return data;
  },

  create: async function(params) {
    // Exclude relationships.
    const values = Object.keys(params.values).reduce((acc, current) => {
      if (model._attributes[current] && model._attributes[current].type) {
        acc[current] = params.values[current];
      }

      return acc;
    }, {});

    const request = await model
      .forge(values)
      .save()
      .catch(err => {
        if (err.detail) {
          const field = _.last(_.words(err.detail.split('=')[0]));
          err = { message: `This ${field} is already taken`, field };
        }

        throw err;
      });

    const entry = request.toJSON ? request.toJSON() : request;

    const relations = model.associations.reduce((acc, association) => {
      acc[association.alias] = params.values[association.alias];
      return acc;
    }, {});

    return this.update({
      [model.primaryKey]: entry[model.primaryKey],
      values: _.assign(
        {
          id: entry[model.primaryKey],
        },
        relations
      ),
    });
  },

  update(params) {
    // Call the business logic located in the hook.
    // This function updates no-relational and relational data.
    return model.updateRelations(params);
  },

  delete: async function(params) {
    return await model
      .forge({
        [model.primaryKey]: params.id,
      })
      .destroy();
  },

  deleteMany: async function(params) {
    return await model
      .query(function(qb) {
        return qb.whereIn('id', params.id);
      })
      .destroy();
  },
});
