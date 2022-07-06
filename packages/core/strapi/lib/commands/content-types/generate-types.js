'use strict';

const tsUtils = require('@strapi/typescript-utils');

const strapi = require('../../index');

module.exports = async function({ outDir, file, verbose }) {
  const appContext = await strapi.compile();
  const app = await strapi(appContext).register();

  await tsUtils.generators.generateSchemasDefinitions({
    strapi: app,
    outDir: outDir || appContext.appDir,
    file,
    dirs: appContext,
    verbose,
  });

  app.destroy();
};
