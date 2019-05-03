'use strict';

const { join } = require('path');
const { existsSync } = require('fs-extra');
const ora = require('ora');
const execa = require('execa');
const { cli } = require('strapi-utils');
const findPackagePath = require('../load/package-path');

module.exports = async plugins => {
  if (!cli.isStrapiApp()) {
    return console.log(
      `⛔️ ${cyan('strapi install')} can only be used inside a Strapi project.`
    );
  }

  const loader = ora();
  const dir = process.cwd();

  const version = require(join(dir, 'package.json')).dependencies.strapi;

  const pluginArgs = plugins.map(name => `strapi-plugin-${name}@${version}`);

  try {
    // verify should rebuild before removing the pacakge
    let shouldRebuild = false;
    for (let name of plugins) {
      let pkgPath = findPackagePath(`strapi-plugin-${name}`);
      if (existsSync(join(pkgPath, 'admin', 'src', 'index.js'))) {
        shouldRebuild = true;
      }
    }

    loader.start(`Uninstalling dependencies`);

    const useYarn = existsSync(join(dir, 'yarn.lock'));
    if (useYarn) {
      await execa('yarn', ['remove', ...pluginArgs]);
    } else {
      await execa('npm', ['remove', ...pluginArgs]);
    }

    loader.succeed();

    if (shouldRebuild) {
      loader.start(`Rebuilding admin UI`);
      await execa('npm', ['run', 'build']);
      loader.succeed();
    }
  } catch (err) {
    loader.clear();
    console.error(err.message);
    process.exit(1);
  }
};
