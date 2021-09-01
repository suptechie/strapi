'use strict';

const {
  mergeSchemas,
  makeExecutableSchema,
  addResolversToSchema,
} = require('@graphql-tools/schema');
const { makeSchema } = require('nexus');
const { pipe } = require('lodash/fp');

const { wrapResolvers } = require('./wrap-resolvers');
const {
  registerSingleType,
  registerCollectionType,
  registerComponent,
  registerScalars,
  registerInternals,
  registerPolymorphicContentType,
  contentType: {
    registerEnumsDefinition,
    registerInputsDefinition,
    registerFiltersDefinition,
    registerDynamicZonesDefinition,
  },
} = require('./register-functions');

module.exports = ({ strapi }) => {
  // Type Registry
  let registry;
  // Builders Instances
  let builders;

  const { KINDS, GENERIC_MORPH_TYPENAME } = strapi.plugin('graphql').service('constants');

  const buildSchema = () => {
    // Create a new empty type registry
    registry = strapi
      .plugin('graphql')
      .service('type-registry')
      .new();

    // Reset the builders instances associated to the
    // content-api, and link the new type registry
    builders = strapi
      .plugin('graphql')
      .service('builders')
      .new('content-api', registry);

    const contentTypes = [
      ...Object.values(strapi.components),
      ...Object.values(strapi.contentTypes),
    ];

    registerScalars({ registry, strapi });
    registerInternals({ registry, strapi });

    // Generate and register definitions for every content type
    registerAPITypes(contentTypes);

    // Generate and register polymorphic types' definitions
    registerMorphTypes(contentTypes);

    // Generate the extension configuration for the content API
    const extension = strapi
      .plugin('graphql')
      .service('extension')
      .for('content-api')
      .generate({ typeRegistry: registry });

    return pipe(
      // Build a collection of schema based on the
      // type registry & the extension configuration
      buildSchemas,
      // Merge every created schema into a single one
      schemas => mergeSchemas({ schemas }),
      // Add the extension's resolvers to the final schema
      schema => addResolversToSchema(schema, extension.resolvers),
      // Wrap resolvers if needed (auth, middlewares, policies...) as configured in the extension
      schema => wrapResolvers({ schema, extension })
    )({ registry, extension });
  };

  const buildSchemas = ({ registry, extension }) => {
    const { types, plugins, typeDefs = [] } = extension;

    // Create a new Nexus schema (shadow CRUD) & add it to the schemas collection
    const nexusSchema = makeSchema({
      types: [
        // Add the auto-generated Nexus types (shadow CRUD)
        registry.definitions,
        // Add every Nexus type registered using the extension service
        types,
      ],

      plugins: [
        // Add every plugin registered using the extension service
        ...plugins,
      ],
    });

    // Build schemas based on SDL type definitions (defined in the extension)
    const sdlSchemas = typeDefs.map(sdl => makeExecutableSchema({ typeDefs: sdl }));

    return [nexusSchema, ...sdlSchemas];
  };

  /**
   * Register needed GraphQL types for every content type
   * @param {object[]} contentTypes
   */
  const registerAPITypes = contentTypes => {
    for (const contentType of contentTypes) {
      const { kind, modelType } = contentType;

      const registerOptions = { registry, strapi, builders };

      // Generate various types associated to the content type
      // (enums, dynamic-zones, filters, inputs...)
      registerEnumsDefinition(contentType, registerOptions);
      registerDynamicZonesDefinition(contentType, registerOptions);
      registerFiltersDefinition(contentType, registerOptions);
      registerInputsDefinition(contentType, registerOptions);

      // Generate & register component's definition
      if (modelType === 'component') {
        registerComponent(contentType, registerOptions);
      }

      // Generate & register single type's definition
      else if (kind === 'singleType') {
        registerSingleType(contentType, registerOptions);
      }

      // Generate & register collection type's definition
      else if (kind === 'collectionType') {
        registerCollectionType(contentType, registerOptions);
      }
    }
  };

  const registerMorphTypes = contentTypes => {
    // Create & register a union type that includes every type or component registered
    const genericMorphType = builders.buildGenericMorphDefinition();
    registry.register(GENERIC_MORPH_TYPENAME, genericMorphType, { kind: KINDS.morph });

    for (const contentType of contentTypes) {
      registerPolymorphicContentType(contentType, { registry, strapi });
    }
  };

  return { buildSchema };
};
