const _ = require('lodash');

module.exports = {
  find: async function (params) {
    return this
      .find(params.where)
      .limit(Number(params.limit))
      .sort(params.sort)
      .skip(Number(params.skip))
      .populate(this.associations.map(x => x.alias).join(' '));
  },

  count: async function (params) {
    return Number(await this
      .count());
  },

  findOne: async function (params) {
    return this
      .findOne(params)
      .populate(this.associations.map(x => x.alias).join(' '));
  },

  create: async function (params) {
    return this.create(Object.keys(params).reduce((acc, current) => {
      if (_.get(this._attributes, [current, 'type'])) {
        acc[current] = params[current];
      }
      
      return acc;
    }, {}));
  },

  update: async function (params) {
    return this.update({
      [this.primaryKey]: params[this.primaryKey] || params.id
    }, params, {
      strict: false
    });
  },

  delete: async function (params) {
    // Delete entry.
    return this
      .remove({
        [this.primaryKey]: params[this.primaryKey] || params.id
      });
  },

  search: async function (params) {
    const re = new RegExp(params.id);

    return this
      .find({
        '$or': [
          { username: re },
          { email: re }
        ]
      });
  }
};
