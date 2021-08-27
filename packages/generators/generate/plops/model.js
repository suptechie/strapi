'use strict';

const { join } = require('path');
const getDestinationPrompts = require('./utils/get-destination-prompts');
const getFilePath = require('./utils/get-file-path');

const DEFAULT_TYPES = [
  // advanced types
  'media',

  // scalar types
  'string',
  'text',
  'richtext',
  'json',
  'enumeration',
  'password',
  'email',
  'integer',
  'biginteger',
  'float',
  'decimal',
  'date',
  'time',
  'datetime',
  'timestamp',
  'boolean',
];

module.exports = (plop, rootDir) => {
  // Model generator
  plop.setGenerator('model', {
    description: 'Generate a model for an API',
    prompts: [
      {
        type: 'input',
        name: 'id',
        message: 'Model name',
      },
      {
        type: 'list',
        name: 'kind',
        message: 'Please choose the model type',
        choices: [
          { name: 'Collection Type', value: 'collectionType' },
          { name: 'Singe Type', value: 'singleType' },
        ],
      },
      ...getDestinationPrompts('model', plop.getDestBasePath()),
      {
        type: 'confirm',
        name: 'useDraftAndPublish',
        message: 'Use draft and publish?',
      },
      {
        type: 'recursive',
        message: 'Add attribute?',
        name: 'attributes',
        prompts: [
          {
            type: 'input',
            name: 'attributeName',
            message: 'Name of attribute',
          },
          {
            type: 'list',
            name: 'attributeType',
            message: 'What type of attribute',
            pageSize: DEFAULT_TYPES.length,
            choices: DEFAULT_TYPES.map(type => {
              return { name: type, value: type };
            }),
          },
          {
            when: answers => answers.attributeType === 'enumeration',
            type: 'input',
            name: 'enum',
            message: 'Add values separated by a comma',
          },
          {
            when: answers => answers.attributeType === 'media',
            type: 'list',
            name: 'multiple',
            message: 'Choose media type',
            choices: [
              { name: 'Multiple', value: true },
              { name: 'Single', value: false },
            ],
          },
        ],
      },
    ],
    actions: answers => {
      const attributes = answers.attributes.reduce((object, answer) => {
        const val = { type: answer.attributeType };

        if (answer.attributeType === 'enumeration') {
          val.enum = answer.enum.split(',').map(item => item.trim());
        }

        if (answer.attributeType === 'media') {
          val.allowedTypes = ['images', 'files', 'videos'];
          val.multiple = answer.multiple;
        }

        return Object.assign(object, { [answer.attributeName]: val }, {});
      }, {});

      const filePath = getFilePath(answers.destination);

      return [
        {
          type: 'add',
          path: `${filePath}/models/{{id}}.js`,
          templateFile: 'templates/model.js.hbs',
        },
        {
          type: 'add',
          path: join(rootDir, `${filePath}/models/{{id}}.settings.json`),
          templateFile: 'templates/model.settings.json.hbs',
        },
        {
          type: 'modify',
          path: join(rootDir, `${filePath}/models/{{id}}.settings.json`),
          transform: template => {
            const parsedTemplate = JSON.parse(template);
            parsedTemplate.attributes = attributes;
            return JSON.stringify(parsedTemplate, null, 2);
          },
        },
      ];
    },
  });
};
