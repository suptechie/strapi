'use strict';

/**
 * Module dependencies
 */

// Node.js core.
const path = require('path');

// Local dependencies.
const packageJSON = require('../json/package.json.js');

/**
 * Copy required files for the generated application
 */

module.exports = {
  moduleDir: path.resolve(__dirname, '..'),
  templatesDirectory: path.resolve(__dirname, '..', 'templates'),
  before: require('./before'),
  after: require('./after'),
  targets: {

    // Main package.
    'package.json': {
      jsonfile: packageJSON
    },

    // Copy dot files.
    '.editorconfig': {
      copy: 'editorconfig'
    },
    '.gitignore': {
      copy: 'gitignore'
    },
    '.npmignore': {
      copy: 'npmignore'
    },

    // Copy Markdown files with some information.
    'README.md': {
      template: 'README.md'
    },

    // Empty admin directory.
    'admin': {
      folder: {}
    },

    // Empty API directory.
    'api': {
      folder: {}
    },

    // Empty data directory.
    'data': {
      folder: {}
    },

    // Empty plugins directory.
    'plugins': {
      folder: {}
    },

    // Empty public directory.
    'public': {
      folder: {}
    }
  }
};
