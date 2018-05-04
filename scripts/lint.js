const path = require('path');
const shell = require('shelljs');
const chalk = require('chalk');
const eslintErrorsFormatter = require('./eslintErrorsFormatter');

const frontCmd =
  'node ../../node_modules/strapi-lint/node_modules/.bin/eslint --ignore-path .gitignore --ignore-pattern \'/admin/build/\' --config ../../node_modules/strapi-lint/lib/internals/eslint/front/.eslintrc.json admin';
const helperCmd =
  'node ../../node_modules/strapi-lint/node_modules/.bin/eslint --ignore-path .gitignore --ignore-pattern \'/admin/build/\' --config ../../node_modules/strapi-lint/lib/internals/eslint/front/.eslintrc.json lib/src';
const backCmd =
  'node ../../node_modules/strapi-lint/node_modules/.bin/eslint --ignore-path .gitignore --ignore-pattern \'/admin\' --config ../../node_modules/strapi-lint/lib/internals/eslint/back/.eslintrc.json controllers config services bin lib';


const watcher = (label, pckgName, type = 'front') => {
  shell.echo(label);
  shell.cd(`packages/${pckgName}`);
  const cmd = pckgName === 'strapi-helper-plugin' ? helperCmd : `${frontCmd} && ${backCmd}`;
  const data = shell.exec(cmd, { silent: true });
  shell.echo(chalk(eslintErrorsFormatter(data.stdout)));
  shell.cd('../..');

  if (data.code !== 0) {
    process.exit(1);
  }
  shell.echo('');
};

const packagesPath = path.resolve(process.env.PWD, 'packages');
shell.ls('* -d', packagesPath)
  .filter(package => package !== 'README.md' && package !== 'strapi-middleware-views' && package !== 'strapi-lint' && package !== 'strapi-plugin-settings-manager')
  .forEach(package => {
    watcher(`Testing ${package}`, package);
  });
