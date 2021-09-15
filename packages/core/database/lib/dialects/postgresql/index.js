'use strict';

const errors = require('../../errors');
const { Dialect } = require('../dialect');
const PostgresqlSchemaInspector = require('./schema-inspector');

class PostgresDialect extends Dialect {
  constructor(db) {
    super(db);

    this.schemaInspector = new PostgresqlSchemaInspector(db);
  }

  useReturning() {
    return true;
  }

  initialize() {
    this.db.connection.client.driver.types.setTypeParser(1700, 'text', parseFloat);
  }

  usesForeignKeys() {
    return true;
  }

  transformErrors(error) {
    switch (error.code) {
      case '23502': {
        throw new errors.NotNullConstraint({ column: error.column });
      }
      default: {
        super.transformErrors(error);
      }
    }
  }
}

module.exports = PostgresDialect;
