'use strict';

/**
 * Module dependencies
 */

// Public node modules.
const _ = require('lodash');

// Utils
const {
  models: { getValuePrimaryKey },
} = require('strapi-utils');

const transformToArrayID = (array, association) => {
  if (_.isArray(array)) {
    array = array.map(value => {
      if (_.isPlainObject(value)) {
        return value._id || value.id || false;
      }

      return value;
    });

    return array.filter(n => n);
  }

  if (association.type === 'model' || (association.type === 'collection' && _.isObject(array))) {
    return _.isEmpty(_.toString(array)) ? [] : transformToArrayID([array]);
  }

  return [];
};

const getModel = (model, plugin) => {
  return (
    _.get(strapi.plugins, [plugin, 'models', model]) ||
    _.get(strapi, ['models', model]) ||
    undefined
  );
};

const removeUndefinedKeys = obj => _.pickBy(obj, _.negate(_.isUndefined));

const addRelationMorph = async (model, { params, transacting } = {}) => {
  return await model.morph.forge().save(
    {
      [`${model.collectionName}_id`]: params.id,
      [`${params.alias}_id`]: params.refId,
      [`${params.alias}_type`]: params.ref,
      field: params.field,
      order: params.order,
    },
    { transacting }
  );
};

const removeRelationMorph = async (model, { params, transacting } = {}) => {
  return await model.morph
    .forge()
    .where(
      _.omitBy(
        {
          [`${model.collectionName}_id`]: params.id,
          [`${params.alias}_id`]: params.refId,
          [`${params.alias}_type`]: params.ref,
          field: params.field,
        },
        _.isUndefined
      )
    )
    .destroy({
      require: false,
      transacting,
    });
};

module.exports = {
  async findOne(params, populate, { transacting } = {}) {
    const record = await this.forge({
      [this.primaryKey]: getValuePrimaryKey(params, this.primaryKey),
    }).fetch({
      transacting,
      withRelated: populate,
    });

    const data = record ? record.toJSON() : record;

    // Retrieve data manually.
    if (_.isEmpty(populate)) {
      const arrayOfPromises = this.associations
        .filter(association => ['manyMorphToOne', 'manyMorphToMany'].includes(association.nature))
        .map(() => {
          return this.morph
            .forge()
            .where({
              [`${this.collectionName}_id`]: getValuePrimaryKey(params, this.primaryKey),
            })
            .fetchAll({
              transacting,
            });
        });

      const related = await Promise.all(arrayOfPromises);

      related.forEach((value, index) => {
        data[this.associations[index].alias] = value ? value.toJSON() : value;
      });
    }

    return data;
  },

  async update(params, { transacting } = {}) {
    const relationUpdates = [];
    const primaryKeyValue = getValuePrimaryKey(params, this.primaryKey);
    const response = await module.exports.findOne.call(this, params, null, {
      transacting,
    });

    // Only update fields which are on this document.
    const values =
      params.parseRelationships === false
        ? params.values
        : Object.keys(removeUndefinedKeys(params.values)).reduce((acc, current) => {
            const property = params.values[current];
            const association = this.associations.filter(x => x.alias === current)[0];
            const details = this._attributes[current];

            if (!association && _.get(details, 'isVirtual') !== true) {
              return _.set(acc, current, property);
            }

            const assocModel = getModel(details.model || details.collection, details.plugin);

            switch (association.nature) {
              case 'oneWay': {
                return _.set(acc, current, _.get(property, assocModel.primaryKey, property));
              }
              case 'oneToOne': {
                if (response[current] === property) return acc;

                if (_.isNull(property)) {
                  const updatePromise = assocModel
                    .where({
                      [assocModel.primaryKey]: getValuePrimaryKey(
                        response[current],
                        assocModel.primaryKey
                      ),
                    })
                    .save(
                      { [details.via]: null },
                      {
                        method: 'update',
                        patch: true,
                        require: false,
                        transacting,
                      }
                    );

                  relationUpdates.push(updatePromise);
                  return _.set(acc, current, null);
                }

                // set old relations to null
                const updateLink = this.where({ [current]: property })
                  .save(
                    { [current]: null },
                    {
                      method: 'update',
                      patch: true,
                      require: false,
                      transacting,
                    }
                  )
                  .then(() => {
                    return assocModel.where({ [this.primaryKey]: property }).save(
                      { [details.via]: primaryKeyValue },
                      {
                        method: 'update',
                        patch: true,
                        require: false,
                        transacting,
                      }
                    );
                  });

                // set new relation
                relationUpdates.push(updateLink);
                return _.set(acc, current, property);
              }
              case 'oneToMany': {
                // receive array of ids or array of objects with ids

                // set relation to null for all the ids not in the list
                const currentIds = response[current];
                const toRemove = _.differenceWith(currentIds, property, (a, b) => {
                  return `${a[assocModel.primaryKey] || a}` === `${b[assocModel.primaryKey] || b}`;
                });

                const updatePromise = assocModel
                  .where(
                    assocModel.primaryKey,
                    'in',
                    toRemove.map(val => val[assocModel.primaryKey] || val)
                  )
                  .save(
                    { [details.via]: null },
                    {
                      method: 'update',
                      patch: true,
                      require: false,
                      transacting,
                    }
                  )
                  .then(() => {
                    return assocModel
                      .where(
                        assocModel.primaryKey,
                        'in',
                        property.map(val => val[assocModel.primaryKey] || val)
                      )
                      .save(
                        { [details.via]: primaryKeyValue },
                        {
                          method: 'update',
                          patch: true,
                          require: false,
                          transacting,
                        }
                      );
                  });

                relationUpdates.push(updatePromise);
                return acc;
              }
              case 'manyToOne': {
                return _.set(acc, current, _.get(property, assocModel.primaryKey, property));
              }
              case 'manyWay':
              case 'manyToMany': {
                const currentValue = transformToArrayID(response[current], association).map(id =>
                  id.toString()
                );
                const storedValue = transformToArrayID(
                  params.values[current],
                  association
                ).map(id => id.toString());

                const toAdd = _.difference(storedValue, currentValue);
                const toRemove = _.difference(currentValue, storedValue);

                const collection = this.forge({
                  [this.primaryKey]: primaryKeyValue,
                })[association.alias]();

                const updatePromise = collection
                  .detach(toRemove, { transacting })
                  .then(() => collection.attach(toAdd, { transacting }));

                relationUpdates.push(updatePromise);
                return acc;
              }
              case 'manyMorphToMany':
              case 'manyMorphToOne': {
                // Update the relational array.
                const refs = params.values[current];

                if (Array.isArray(refs) && refs.length === 0) {
                  // clear related
                  relationUpdates.push(
                    removeRelationMorph(this, { params: { id: primaryKeyValue }, transacting })
                  );
                  break;
                }

                refs.forEach(obj => {
                  const targetModel = strapi.getModel(
                    obj.ref,
                    obj.source !== 'content-manager' ? obj.source : null
                  );

                  const reverseAssoc = targetModel.associations.find(
                    assoc => assoc.alias === obj.field
                  );

                  // Remove existing relationship because only one file
                  // can be related to this field.
                  if (reverseAssoc && reverseAssoc.nature === 'oneToManyMorph') {
                    relationUpdates.push(
                      removeRelationMorph(this, {
                        params: {
                          alias: association.alias,
                          ref: targetModel.collectionName,
                          refId: obj.refId,
                          field: obj.field,
                        },
                        transacting,
                      }).then(() =>
                        addRelationMorph(this, {
                          params: {
                            id: response[this.primaryKey],
                            alias: association.alias,
                            ref: targetModel.collectionName,
                            refId: obj.refId,
                            field: obj.field,
                          },
                          transacting,
                        })
                      )
                    );

                    return;
                  }

                  // TODO: recompute the order when adding a ref
                  relationUpdates.push(
                    addRelationMorph(this, {
                      params: {
                        id: response[this.primaryKey],
                        alias: association.alias,
                        ref: targetModel.collectionName,
                        refId: obj.refId,
                        field: obj.field,
                      },
                      transacting,
                    })
                  );
                });
                break;
              }
              case 'oneToManyMorph':
              case 'manyToManyMorph': {
                const currentValue = transformToArrayID(
                  params.values[current],
                  association
                ).map(id => id.toString());

                const model = getModel(details.collection || details.model, details.plugin);

                const promise = removeRelationMorph(model, {
                  params: {
                    alias: association.via,
                    ref: this.collectionName,
                    refId: response.id,
                    field: association.alias,
                  },
                  transacting,
                }).then(() => {
                  return Promise.all(
                    currentValue.map((id, idx) => {
                      return addRelationMorph(model, {
                        params: {
                          id,
                          alias: association.via,
                          ref: this.collectionName,
                          refId: response.id,
                          field: association.alias,
                          order: idx + 1,
                        },
                        transacting,
                      });
                    })
                  );
                });

                relationUpdates.push(promise);

                break;
              }
              case 'oneMorphToOne':
              case 'oneMorphToMany': {
                break;
              }
              default:
            }

            return acc;
          }, {});

    await Promise.all(relationUpdates);

    delete values[this.primaryKey];
    if (!_.isEmpty(values)) {
      await this.forge({
        [this.primaryKey]: getValuePrimaryKey(params, this.primaryKey),
      }).save(values, {
        patch: true,
        transacting,
      });
    }

    const result = await this.forge({
      [this.primaryKey]: getValuePrimaryKey(params, this.primaryKey),
    }).fetch({
      transacting,
    });

    return result && result.toJSON ? result.toJSON() : result;
  },
};
