'use strict';

const { cleanInverseOrderColumn } = require('../../regular-relations');

const replaceRegularRelations = async ({ id, cloneId, attribute, transaction: trx }) => {
  const { joinTable } = attribute;
  const { joinColumn, inverseJoinColumn } = joinTable;

  // We are effectively stealing the relation from the cloned entity
  await strapi.db.entityManager
    .createQueryBuilder(joinTable.name)
    .update({ [joinColumn.name]: id })
    .where({ [joinColumn.name]: cloneId })
    // TODO: Exclude some relations from being replaced
    // .where({ $not: { [inverseJoinColumn.name]: relationsToDeleteIds } })
    .onConflict([joinColumn.name, inverseJoinColumn.name])
    .ignore()
    .transacting(trx)
    .execute();
};

const cloneRegularRelations = async ({ id, cloneId, attribute, transaction: trx }) => {
  const { joinTable } = attribute;
  const { joinColumn, inverseJoinColumn, orderColumnName, inverseOrderColumnName } = joinTable;
  const connection = strapi.db.getConnection();

  // Get the columns to select
  const columns = [joinColumn.name, inverseJoinColumn.name];
  if (orderColumnName) columns.push(orderColumnName);
  if (inverseOrderColumnName) columns.push(inverseOrderColumnName);
  if (joinTable.on) columns.push(...Object.keys(joinTable.on));

  const selectStatement = connection
    .select(
      // Override joinColumn with the new id
      { [joinColumn.name]: id },
      // The rest of columns will be the same
      ...columns.slice(1)
    )
    .where(joinColumn.name, cloneId)
    // TODO: Exclude some relations from being replaced
    // .where({ $not: { [inverseJoinColumn.name]: relationsToDeleteIds } })
    .from(joinTable.name)
    .toSQL();

  // Insert the clone relations
  await strapi.db.entityManager
    .createQueryBuilder(joinTable.name)
    .insert(
      strapi.db.connection.raw(
        `(${columns.join(',')})  ${selectStatement.sql}`,
        selectStatement.bindings
      )
    )
    .onConflict([joinColumn.name, inverseJoinColumn.name])
    .ignore()
    .transacting(trx)
    .execute();

  // Clean the inverse order column
  if (inverseOrderColumnName) {
    await cleanInverseOrderColumn({
      id,
      attribute,
      trx,
    });
  }
};

module.exports = {
  replaceRegularRelations,
  cloneRegularRelations,
};
