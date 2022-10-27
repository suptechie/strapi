'use strict';

const { Readable } = require('stream');

const kQueryDone = Symbol('kOpDone');
const kPerformingQuery = Symbol('kPerformingQuery');

const { applyPopulate } = require('../populate');
const { fromRow } = require('../transform');

class ReadableStrapiQuery extends Readable {
  /**
   * @param {object} options
   * @param {ReturnType<typeof import('../../query-builder')>} options.qb The strapi query builder instance
   * @param {string} options.uid The model uid
   * @param {import('../../../index').Database} options.db The Database instance
   * @param {boolean} [options.mapResults] The maximum number of entities to fetch per query
   * @param {number} [options.batchSize] The maximum number of entities to fetch per query
   */
  constructor({ qb, db, uid, mapResults = true, batchSize = 500 }) {
    super({ objectMode: true, highWaterMark: batchSize });

    // Extract offset & limit from the query-builder's state
    const { offset, limit } = qb.state;

    // Original offset value
    this._offset = offset === undefined ? 0 : offset;

    // Max amount of entities to fetch, force null as undefined value
    this._limit = offset === undefined ? null : limit;

    // Total amount of entities fetched
    this._fetched = 0;

    /**
     * Original query
     * @type {import('knex').Knex}
     */
    this._query = qb.getKnexQuery();

    // Query Builder instance
    this._qb = qb;

    // Database related properties
    this._db = db;
    this._uid = uid;
    this._meta = db.metadata.get(uid);

    // Stream params
    this._batchSize = batchSize;
    this._mapResults = mapResults;

    // States
    this[kPerformingQuery] = false;
  }

  _destroy(err, cb) {
    // If the stream is destroyed while a query is being made, then wait for a
    // kQueryDone event to be emitted before actually destroying the stream
    if (this[kPerformingQuery]) {
      this.once(kQueryDone, (er) => cb(err || er));
    } else {
      cb(err);
    }
  }

  /**
   * Custom ._read() implementation
   *
   *  NOTE: Here "size" means the number of entities to be read from the database.
   *  Not the actual byte size, as it would means that we need to return partial entities.
   *
   * @param {number} size
   */
  async _read(size) {
    const query = this._query;

    // Remove the original offset & limit properties from the query
    // Theoretically, they would be replaced by calling them again, but this is just to be sure
    query.clear('limit').clear('offset');

    // Define the maximum read size based on the limit and the requested size
    // NOTE: size is equal to _batchSize by default. Since we want to allow customizing it on
    // the fly, we need to use its value instead of batchSize when computing the maxReadSize value
    const maxReadSize =
      // if no limit is defined in the query, use the given size,
      // otherwise, use the smallest value between the two
      this._limit === null ? size : Math.min(size, this._limit);

    // Compute the limit for the next query
    const limit =
      // If a limit is defined
      this._limit !== null &&
      // And reading `maxReadSize` would fetch too many entities (> _limit)
      this._fetched + maxReadSize > this._limit
        ? // Then adjust the limit so that it only get the remaining entities
          this._limit - this._fetched
        : // Else, use the max read size
          maxReadSize;

    // If we don't have anything left to read (_limit === _fetched),
    // don't bother making the query and end the stream by pushing null
    if (limit <= 0) {
      this.push(null);
      return;
    }

    // Compute the offset (base offset + number of entities already fetched)
    const offset = this._offset + this._fetched;

    // Update the query with the new values (offset + limit)
    query.offset(offset).limit(limit);

    // Lock the ._destroy()
    this[kPerformingQuery] = true;

    let results;
    let count;
    let err;

    try {
      // Execute the query and store the results & count
      results = await query;

      const { populate } = this._qb.state;

      // Apply populate if needed
      if (populate && results) {
        await applyPopulate(results, populate, { qb: this._qb, uid: this._uid, db: this._db });
      }

      // Map results if asked to
      if (this._mapResults && results) {
        results = fromRow(this._meta, results);
      }

      count = results.length;
    } catch (e) {
      err = e;
    }

    // Unlock the ._destroy()
    this[kPerformingQuery] = false;

    // Tell ._destroy() that it's now safe to close the db connection
    // Q: Should we push & return entities anyway or should we assume that the user wanted to abort the query?
    if (this.destroyed) {
      this.emit(kQueryDone);
      return;
    }

    // If there is an error, destroy with the given error
    if (err) {
      this.destroy(err);
      return;
    }

    // Update the amount of fetched entities
    this._fetched += count;

    // While there is at least one value to unpack
    while (results.length) {
      // Add the first one to the stream's queue
      this.push(results.shift());
    }

    // If the amount of fetched entities is smaller than the
    // maximum read size, Then push null to close the stream
    if (this._fetched === this._limit || count < this._batchSize) {
      this.push(null);
    }
  }
}

module.exports = ReadableStrapiQuery;
