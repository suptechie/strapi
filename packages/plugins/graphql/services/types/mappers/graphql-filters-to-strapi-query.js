'use strict';

const { has, mapKeys, propEq, isNil } = require('lodash/fp');

const operators = require('../../schema/builders/filters/operators');
const { isMedia, isRelation, isScalar } = require('../utils');

const ROOT_LEVEL_OPERATORS = [operators.AND, operators.OR, operators.NOT];

// todo[v4]: Find a way to get that dynamically
const virtualScalarAttributes = ['id'];

/**
 * Transform one or many GraphQL filters object into a valid Strapi query
 * @param {object | object[]} filters
 * @param {object} contentType
 * @return {object | object[]}
 */
const graphQLFiltersToStrapiQuery = (filters, contentType = {}) => {
  // Handle unwanted scenario where there is no filters defined
  if (isNil(filters)) {
    return {};
  }

  // If filters is a collection, then apply the transformation to every item of the list
  if (Array.isArray(filters)) {
    return filters.map(filtersItem => graphQLFiltersToStrapiQuery(filtersItem, contentType));
  }

  const resultMap = {};
  const { attributes } = contentType;

  const isAttribute = attributeName => {
    return virtualScalarAttributes.includes(attributeName) || has(attributeName, attributes);
  };

  for (const [key, value] of Object.entries(filters)) {
    // If the key is an attribute, update the value
    if (isAttribute(key)) {
      const attribute = attributes[key];

      // If it's a scalar attribute
      if (virtualScalarAttributes.includes(key) || isScalar(attribute)) {
        // Then map over the filters object (`value`) and replace GraphQL operators (`key`) with Strapi's
        resultMap[key] = mapKeys(key => operators[key].strapiOperator, value);
      }

      // If it's a deep filter on a relation
      else if (isRelation(attribute) || isMedia(attribute)) {
        // Fetch the model from the relation
        const relModel = strapi.getModel(attribute.target);

        // Recursively apply the mapping to the value using the fetched model,
        // and update the value within `resultMap`
        resultMap[key] = graphQLFiltersToStrapiQuery(value, relModel);
      }
    }

    // Handle the case where the key is not an attribute (operator, ...)
    else {
      const rootLevelOperator = ROOT_LEVEL_OPERATORS.find(propEq('fieldName', key));

      // If it's a root level operator (AND, NOT, OR, ...)
      if (rootLevelOperator) {
        const { strapiOperator } = rootLevelOperator;

        // Transform the current value recursively and add it to the resultMap
        // object using the strapiOperator equivalent of the GraphQL key
        resultMap[strapiOperator] = graphQLFiltersToStrapiQuery(value, contentType);
      }
    }
  }

  return resultMap;
};

module.exports = {
  graphQLFiltersToStrapiQuery,
};
