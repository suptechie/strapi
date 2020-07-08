'use strict';

const _ = require('lodash');
const mongoose = require('mongoose');

const utilsModels = require('strapi-utils').models;
const utils = require('./utils');
const relations = require('./relations');
const { findComponentByGlobalId } = require('./utils/helpers');

const isPolymorphicAssoc = assoc => {
  return assoc.nature.toLowerCase().indexOf('morph') !== -1;
};

module.exports = ({ models, target }, ctx) => {
  const { instance } = ctx;

  function mountModel(model) {
    const definition = models[model];
    definition.orm = 'mongoose';
    definition.associations = [];
    definition.globalName = _.upperFirst(_.camelCase(definition.globalId));
    definition.loadedModel = {};
    // Set the default values to model settings.
    _.defaults(definition, {
      primaryKey: '_id',
      primaryKeyType: 'string',
    });

    if (!definition.uid.startsWith('strapi::') && definition.modelType !== 'component') {
      definition.attributes['created_by'] = {
        model: 'user',
        plugin: 'admin',
      };

      definition.attributes['updated_by'] = {
        model: 'user',
        plugin: 'admin',
      };
    }

    const componentAttributes = Object.keys(definition.attributes).filter(key =>
      ['component', 'dynamiczone'].includes(definition.attributes[key].type)
    );

    const scalarAttributes = Object.keys(definition.attributes).filter(key => {
      const { type } = definition.attributes[key];
      return type !== undefined && type !== null && type !== 'component' && type !== 'dynamiczone';
    });

    const relationalAttributes = Object.keys(definition.attributes).filter(key => {
      const { type } = definition.attributes[key];
      return type === undefined;
    });

    // handle component and dynamic zone attrs
    if (componentAttributes.length > 0) {
      // create join morph collection thingy
      componentAttributes.forEach(name => {
        definition.loadedModel[name] = [
          {
            kind: String,
            ref: {
              type: mongoose.Schema.Types.ObjectId,
              refPath: `${name}.kind`,
            },
          },
        ];
      });
    }

    // handle scalar attrs
    scalarAttributes.forEach(name => {
      const attr = definition.attributes[name];

      definition.loadedModel[name] = {
        ...attr,
        ...utils(instance).convertType(name, attr),
      };
    });

    // handle relational attrs
    relationalAttributes.forEach(name => {
      buildRelation({
        definition,
        model,
        instance,
        name,
        attribute: definition.attributes[name],
      });
    });

    const schema = new instance.Schema(
      _.omitBy(definition.loadedModel, ({ type }) => type === 'virtual')
    );

    const findLifecycles = ['find', 'findOne', 'findOneAndUpdate', 'findOneAndRemove'];

    /*
        Override populate path for polymorphic association.
        It allows us to make Upload.find().populate('related')
        instead of Upload.find().populate('related.item')
      */
    const morphAssociations = definition.associations.filter(isPolymorphicAssoc);

    const populateFn = createOnFetchPopulateFn({
      componentAttributes,
      morphAssociations,
      definition,
    });

    findLifecycles.forEach(key => {
      schema.pre(key, populateFn);
    });

    // Add virtual key to provide populate and reverse populate
    _.forEach(
      _.pickBy(definition.loadedModel, model => {
        return model.type === 'virtual';
      }),
      (value, key) => {
        schema.virtual(key.replace('_v', ''), {
          ref: value.ref,
          localField: '_id',
          foreignField: value.via,
          justOne: value.justOne || false,
        });
      }
    );

    target[model].allAttributes = _.clone(definition.attributes);

    // Use provided timestamps if the elemnets in the array are string else use default.
    const timestampsOption = _.get(definition, 'options.timestamps', true);
    if (_.isArray(timestampsOption)) {
      const [createAtCol = 'createdAt', updatedAtCol = 'updatedAt'] = timestampsOption;

      schema.set('timestamps', {
        createdAt: createAtCol,
        updatedAt: updatedAtCol,
      });

      target[model].allAttributes[createAtCol] = {
        type: 'timestamp',
      };
      target[model].allAttributes[updatedAtCol] = {
        type: 'timestamp',
      };
    } else if (timestampsOption === true) {
      schema.set('timestamps', true);

      _.set(definition, 'options.timestamps', ['createdAt', 'updatedAt']);

      target[model].allAttributes.createdAt = {
        type: 'timestamp',
      };
      target[model].allAttributes.updatedAt = {
        type: 'timestamp',
      };
    }
    schema.set('minimize', _.get(definition, 'options.minimize', false) === true);

    const refToStrapiRef = obj => {
      const ref = obj.ref;

      let plainData = ref && typeof ref.toJSON === 'function' ? ref.toJSON() : ref;

      if (typeof plainData !== 'object') return ref;

      return {
        __contentType: obj.kind,
        ...ref,
      };
    };

    schema.options.toObject = schema.options.toJSON = {
      virtuals: true,
      transform: function(doc, returned) {
        // Remover $numberDecimal nested property.

        Object.keys(returned)
          .filter(key => returned[key] instanceof mongoose.Types.Decimal128)
          .forEach(key => {
            // Parse to float number.
            returned[key] = parseFloat(returned[key].toString());
          });

        morphAssociations.forEach(association => {
          if (
            Array.isArray(returned[association.alias]) &&
            returned[association.alias].length > 0
          ) {
            // Reformat data by bypassing the many-to-many relationship.
            switch (association.nature) {
              case 'oneMorphToOne':
                returned[association.alias] = refToStrapiRef(returned[association.alias][0]);

                break;

              case 'manyMorphToMany':
              case 'manyMorphToOne': {
                returned[association.alias] = returned[association.alias].map(obj =>
                  refToStrapiRef(obj)
                );

                break;
              }
              default:
            }
          }
        });

        componentAttributes.forEach(name => {
          const attribute = definition.attributes[name];
          const { type } = attribute;

          if (type === 'component') {
            if (Array.isArray(returned[name])) {
              const components = returned[name].map(el => el.ref);
              // Reformat data by bypassing the many-to-many relationship.
              returned[name] =
                attribute.repeatable === true ? components : _.first(components) || null;
            }
          }

          if (type === 'dynamiczone') {
            if (returned[name]) {
              returned[name] = returned[name].map(el => {
                return {
                  __component: findComponentByGlobalId(el.kind).uid,
                  ...el.ref,
                };
              });
            }
          }
        });
      },
    };

    // Instantiate model.
    const Model = instance.model(definition.globalId, schema, definition.collectionName);

    const handleIndexesErrors = () => {
      Model.on('index', error => {
        if (error) {
          if (error.code === 11000) {
            strapi.log.error(
              `Unique constraint fails, make sure to update your data and restart to apply the unique constraint.\n\t- ${error.message}`
            );
          } else {
            strapi.log.error(`An index error happened, it wasn't applied.\n\t- ${error.message}`);
          }
        }
      });
    };

    // Only sync indexes in development env while it's not possible to create complex indexes directly from models
    // In other environments it will simply create missing indexes (those defined in the models but not present in db)
    if (strapi.app.env === 'development') {
      // Ensure indexes are synced with the model, prevent duplicate index errors
      // Side-effect: Delete all the indexes not present in the model.json
      Model.syncIndexes(null, handleIndexesErrors);
    } else {
      handleIndexesErrors();
    }

    // Expose ORM functions through the `target` object.
    target[model] = _.assign(Model, target[model]);

    // Push attributes to be aware of model schema.
    target[model]._attributes = definition.attributes;
    target[model].updateRelations = relations.update;
    target[model].deleteRelations = relations.deleteRelations;
  }

  // Parse every authenticated model.
  Object.keys(models).map(mountModel);
};

const createOnFetchPopulateFn = ({ morphAssociations, componentAttributes, definition }) => {
  return function() {
    const populatedPaths = this.getPopulatedPaths();

    morphAssociations.forEach(association => {
      const { alias, nature } = association;

      if (['oneToManyMorph', 'manyToManyMorph'].includes(nature)) {
        this.populate(alias);
      } else if (populatedPaths.includes(alias)) {
        _.set(this._mongooseOptions.populate, [alias, 'path'], `${alias}.ref`);
      }
    });

    if (definition.modelType === 'component') {
      definition.associations
        .filter(assoc => !isPolymorphicAssoc(assoc))
        .filter(ast => ast.autoPopulate !== false)
        .forEach(ast => {
          this.populate({ path: ast.alias });
        });
    }

    componentAttributes.forEach(key => {
      this.populate({ path: `${key}.ref` });
    });
  };
};

const buildRelation = ({ definition, model, instance, attribute, name }) => {
  const { nature, verbose } =
    utilsModels.getNature({
      attribute,
      attributeName: name,
      modelName: model.toLowerCase(),
    }) || {};

  // Build associations key
  utilsModels.defineAssociations(model.toLowerCase(), definition, attribute, name);

  const getRef = (name, plugin) => {
    return strapi.db.getModel(name, plugin).globalId;
  };

  const setField = (name, val) => {
    definition.loadedModel[name] = val;
  };

  const { ObjectId } = instance.Schema.Types;

  switch (verbose) {
    case 'hasOne': {
      const ref = getRef(attribute.model, attribute.plugin);

      setField(name, { type: ObjectId, ref });

      break;
    }
    case 'hasMany': {
      const FK = _.find(definition.associations, {
        alias: name,
      });

      const ref = getRef(attribute.collection, attribute.plugin);

      if (FK) {
        setField(name, {
          type: 'virtual',
          ref,
          via: FK.via,
          justOne: false,
        });

        // Set this info to be able to see if this field is a real database's field.
        attribute.isVirtual = true;
      } else {
        setField(name, [{ type: ObjectId, ref }]);
      }
      break;
    }
    case 'belongsTo': {
      const FK = _.find(definition.associations, {
        alias: name,
      });

      const ref = getRef(attribute.model, attribute.plugin);

      if (
        FK &&
        FK.nature !== 'oneToOne' &&
        FK.nature !== 'manyToOne' &&
        FK.nature !== 'oneWay' &&
        FK.nature !== 'oneToMorph'
      ) {
        setField(name, {
          type: 'virtual',
          ref,
          via: FK.via,
          justOne: true,
        });

        // Set this info to be able to see if this field is a real database's field.
        attribute.isVirtual = true;
      } else {
        setField(name, { type: ObjectId, ref });
      }

      break;
    }
    case 'belongsToMany': {
      const ref = getRef(attribute.collection, attribute.plugin);

      if (nature === 'manyWay') {
        setField(name, [{ type: ObjectId, ref }]);
      } else {
        const FK = _.find(definition.associations, {
          alias: name,
        });

        // One-side of the relationship has to be a virtual field to be bidirectional.
        if ((FK && _.isUndefined(FK.via)) || attribute.dominant !== true) {
          setField(name, {
            type: 'virtual',
            ref,
            via: FK.via,
          });

          // Set this info to be able to see if this field is a real database's field.
          attribute.isVirtual = true;
        } else {
          setField(name, [{ type: ObjectId, ref }]);
        }
      }
      break;
    }
    case 'morphOne': {
      const ref = getRef(attribute.model, attribute.plugin);
      setField(name, { type: ObjectId, ref });
      break;
    }
    case 'morphMany': {
      const ref = getRef(attribute.collection, attribute.plugin);
      setField(name, [{ type: ObjectId, ref }]);
      break;
    }

    case 'belongsToMorph': {
      setField(name, {
        kind: String,
        [attribute.filter]: String,
        ref: { type: ObjectId, refPath: `${name}.kind` },
      });
      break;
    }
    case 'belongsToManyMorph': {
      setField(name, [
        {
          kind: String,
          [attribute.filter]: String,
          ref: { type: ObjectId, refPath: `${name}.kind` },
        },
      ]);
      break;
    }
    default:
      break;
  }
};
