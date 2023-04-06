'use strict';

const { getLocalScript } = require('../../../utils/helpers');

module.exports = ({ command /* , argv */ }) => {
  command
    .command('configuration:dump')
    .alias('config:dump')
    .description('Dump configurations of your application')
    .option('-f, --file <file>', 'Output file, default output is stdout')
    .option('-p, --pretty', 'Format the output JSON with indentation and line breaks', false)
    .action(getLocalScript('configuration/dump'));
};
