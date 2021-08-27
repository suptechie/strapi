'use strict';

const { join } = require('path');
const getDestinationPrompts = require('./utils/get-destination-prompts');

module.exports = (plop, rootDir) => {
  // Policy generator
  plop.setGenerator('policy', {
    description: 'Generate a policy for an API',
    prompts: [
      {
        type: 'input',
        name: 'id',
        message: 'Policy name',
      },
      ...getDestinationPrompts('policy', rootDir),
    ],
    actions: answers => {
      let filePath;
      if (answers.destination === 'api') {
        filePath = `api/{{api}}`;
      } else if (answers.destination === 'plugin') {
        filePath = `plugins/{{plugin}}`;
      } else {
        filePath = ``;
      }

      return [
        {
          type: 'add',
          path: join(rootDir, `${filePath}/config/policies/{{id}}.js`),
          templateFile: 'templates/policy.js.hbs',
        },
      ];
    },
  });
};
