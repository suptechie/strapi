'use strict';
/* eslint-disable no-useless-escape */
const path = require('path');
const _ = require('lodash');
const fs = require('fs-extra');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const chalk = require('chalk');
const chokidar = require('chokidar');
const getWebpackConfig = require('./webpack.config');

const getPkgPath = name => path.dirname(require.resolve(`${name}/package.json`));

function getCustomWebpackConfig(dir, config) {
  const adminConfigPath = path.join(dir, 'admin', 'admin.webpack.config.js');

  let webpackConfig = getWebpackConfig(config);

  if (fs.existsSync(adminConfigPath)) {
    const webpackAdminConfig = require(path.resolve(adminConfigPath));

    if (_.isFunction(webpackAdminConfig)) {
      webpackConfig = webpackAdminConfig(webpackConfig, webpack);

      if (!webpackConfig) {
        console.error(
          `${chalk.red('Error:')} Nothing was returned from your custom webpack configuration`
        );
        process.exit(1);
      }
    }
  }

  return webpackConfig;
}

async function build({ dir, env, options, optimize }) {
  // Create the cache dir containing the front-end files.
  await createCacheDir(dir);

  const cacheDir = path.resolve(dir, '.cache');
  const entry = path.resolve(cacheDir, 'admin', 'src');
  const dest = path.resolve(dir, 'build');

  // Roots for the @strapi/babel-plugin-switch-ee-ce
  const roots = {
    eeRoot: path.resolve(cacheDir, 'ee', 'admin'),
    ceRoot: path.resolve(cacheDir, 'admin', 'src'),
  };

  const config = getCustomWebpackConfig(dir, { entry, dest, env, options, optimize, roots });

  const compiler = webpack(config);

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        console.error(err.stack || err);

        if (err.details) {
          console.error(err.details);
        }
        return reject(err);
      }

      const info = stats.toJson();

      if (stats.hasErrors()) {
        console.error(info.errors);
      }

      return resolve({
        stats,

        warnings: info.warnings,
      });
    });
  });
}

async function createPluginsJs(plugins, localPlugins, dest) {
  const createPluginsArray = plugins =>
    plugins.map(name => {
      const shortName = _.camelCase(name.replace(/^@strapi\/plugin-/i, ''));

      return { name, shortName };
    });
  const appPluginsArray = createPluginsArray(plugins);
  const localPluginsArray = createPluginsArray(localPlugins);

  const content = `
${appPluginsArray
  .map(({ name, shortName }) => {
    const req = `'../../plugins/${name}/admin/src'`;

    return `import ${shortName} from ${req};`;
  })
  .join('\n')}
${localPluginsArray
  .map(({ name, shortName }) => {
    const req = `'../../../plugins/${name}/admin/src'`;

    return `import ${shortName} from ${req};`;
  })
  .join('\n')}

const plugins = {
${[...appPluginsArray, ...localPluginsArray]
  .map(({ name, shortName }) => {
    return `  '${name}': ${shortName},`;
  })
  .join('\n')}
};

export default plugins;
`;

  return fs.writeFile(path.resolve(dest, 'admin', 'src', 'plugins.js'), content);
}

async function clean({ dir }) {
  const buildDir = path.join(dir, 'build');
  const cacheDir = path.join(dir, '.cache');

  fs.removeSync(buildDir);
  fs.removeSync(cacheDir);
}

async function copyPlugin(name, dest) {
  const pkgFilePath = getPkgPath(name);

  const resolveDepPath = (...args) => path.resolve(pkgFilePath, ...args);
  const resolveDest = (...args) => path.resolve(dest, 'plugins', name, ...args);

  const copy = (...args) => {
    return fs.copy(resolveDepPath(...args), resolveDest(...args));
  };

  // Copy the entire admin folder
  await copy('admin');
  await copy('package.json');
}

async function copyAdmin(dest) {
  const adminPath = getPkgPath('@strapi/admin');

  // TODO copy ee folders for plugins
  await fs.copy(path.resolve(adminPath, 'ee', 'admin'), path.resolve(dest, 'ee', 'admin'));

  await fs.ensureDir(path.resolve(dest, 'config'));
  await fs.copy(path.resolve(adminPath, 'admin'), path.resolve(dest, 'admin'));
  await fs.copy(
    path.resolve(adminPath, 'config', 'layout.js'),
    path.resolve(dest, 'config', 'layout.js')
  );

  // Copy package.json
  await fs.copy(path.resolve(adminPath, 'package.json'), path.resolve(dest, 'package.json'));
}

async function copyCustomAdmin(src, dest) {
  await fs.copy(src, path.resolve(dest, 'admin'));
}

async function createCacheDir(dir) {
  const cacheDir = path.resolve(dir, '.cache');

  const pkgJSON = require(path.join(dir, 'package.json'));

  const pluginsToCopy = Object.keys(pkgJSON.dependencies).filter(
    dep =>
      dep.startsWith('@strapi/plugin') &&
      fs.existsSync(path.resolve(getPkgPath(dep), 'admin', 'src', 'index.js'))
  );

  let localPluginsToCopy = [];
  if (fs.existsSync(path.join(dir, 'plugins'))) {
    localPluginsToCopy = fs
      .readdirSync(path.join(dir, 'plugins'))
      .filter(plugin =>
        fs.existsSync(path.resolve(dir, 'plugins', plugin, 'admin', 'src', 'index.js'))
      );
  }

  // TODO: add logic to avoid copying files if not necessary

  // create .cache dir
  await fs.emptyDir(cacheDir);

  // copy admin core code
  await copyAdmin(cacheDir);

  // copy plugins code
  await Promise.all(pluginsToCopy.map(name => copyPlugin(name, cacheDir)));

  // override admin code with user customizations
  if (fs.pathExistsSync(path.join(dir, 'admin'))) {
    await copyCustomAdmin(path.join(dir, 'admin'), cacheDir);
  }

  // Copy admin.config.js
  const customAdminConfigFilePath = path.join(dir, 'admin', 'admin.config.js');

  if (fs.existsSync(customAdminConfigFilePath)) {
    await fs.copy(
      customAdminConfigFilePath,
      path.resolve(cacheDir, 'admin', 'src', 'admin.config.js')
    );
  }

  // create plugins.js with plugins requires
  await createPluginsJs(pluginsToCopy, localPluginsToCopy, cacheDir);

  // override plugins' admin code with user customizations
  const pluginsToOverride = pluginsToCopy.reduce((acc, current) => {
    const pluginName = current.replace(/^@strapi\/plugin-/i, '');

    if (fs.pathExistsSync(path.join(dir, 'extensions', pluginName, 'admin'))) {
      acc.push(pluginName);
    }

    return acc;
  }, []);

  await Promise.all(
    pluginsToOverride.map(plugin =>
      copyCustomAdmin(
        path.join(dir, 'extensions', plugin, 'admin'),
        path.join(cacheDir, 'plugins', `@strapi/plugin-${plugin}`)
      )
    )
  );
}

async function watchAdmin({ dir, host, port, browser, options }) {
  // Create the cache dir containing the front-end files.
  await createCacheDir(dir);

  const entry = path.join(dir, '.cache', 'admin', 'src');
  const dest = path.join(dir, 'build');
  const env = 'development';

  const cacheDir = path.join(dir, '.cache');

  // Roots for the @strapi/babel-plugin-switch-ee-ce
  const roots = {
    eeRoot: path.resolve(cacheDir, 'ee', 'admin'),
    ceRoot: path.resolve(cacheDir, 'admin', 'src'),
  };

  const args = {
    entry,
    dest,
    env,
    port,
    options,
    roots,
  };

  const opts = {
    clientLogLevel: 'silent',
    quiet: true,
    open: browser === 'true' ? true : browser,
    publicPath: options.adminPath,
    historyApiFallback: {
      index: options.adminPath,
      disableDotRule: true,
    },
  };

  const webpackConfig = getCustomWebpackConfig(dir, args);
  const server = new WebpackDevServer(webpack(webpackConfig), opts);

  server.listen(port, host, function(err) {
    if (err) {
      console.log(err);
    }

    console.log(chalk.green('Starting the development server...'));
    console.log();
    console.log(chalk.green(`Admin development at http://${host}:${port}${opts.publicPath}`));
  });

  watchFiles(dir, options.watchIgnoreFiles);
}

async function watchFiles(dir, ignoreFiles = []) {
  const cacheDir = path.join(dir, '.cache');
  const pkgJSON = require(path.join(dir, 'package.json'));
  const admin = path.join(dir, 'admin');
  const extensionsPath = path.join(dir, 'extensions');

  const appPlugins = Object.keys(pkgJSON.dependencies).filter(
    dep =>
      dep.startsWith('@strapi/plugin') &&
      fs.existsSync(path.resolve(getPkgPath(dep), 'admin', 'src', 'index.js'))
  );
  const pluginsToWatch = appPlugins.map(plugin =>
    path.join(extensionsPath, plugin.replace(/^@strapi\/plugin-/i, ''), 'admin')
  );
  const filesToWatch = [admin, ...pluginsToWatch];

  const watcher = chokidar.watch(filesToWatch, {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ignored: [...ignoreFiles],
  });

  watcher.on('all', async (event, filePath) => {
    const isExtension = filePath.includes(extensionsPath);
    const pluginName = isExtension ? filePath.replace(extensionsPath, '').split(path.sep)[1] : '';

    const packageName = isExtension ? `@strapi/plugin-${pluginName}` : '@strapi/admin';

    const targetPath = isExtension
      ? path.normalize(filePath.split(extensionsPath)[1].replace(pluginName, ''))
      : path.normalize(filePath.split(admin)[1]);

    const destFolder = isExtension
      ? path.join(cacheDir, 'plugins', packageName)
      : path.join(cacheDir, 'admin');

    if (event === 'unlink' || event === 'unlinkDir') {
      const originalFilePathInNodeModules = path.join(
        getPkgPath(packageName),
        isExtension ? '' : 'admin',
        targetPath
      );

      // Remove the file or folder
      // We need to copy the original files when deleting an override one
      try {
        fs.removeSync(path.join(destFolder, targetPath));
      } catch (err) {
        console.log('An error occured while deleting the file', err);
      }

      // Check if the file or folder exists in node_modules
      // If so copy the old one
      if (fs.pathExistsSync(path.resolve(originalFilePathInNodeModules))) {
        try {
          await fs.copy(
            path.resolve(originalFilePathInNodeModules),
            path.join(destFolder, targetPath)
          );

          // The plugins.js file needs to be recreated
          // when we delete either the admin folder
          // the admin/src folder
          // or the plugins.js file
          // since the path are different when developing inside the monorepository or inside an app
          const shouldCopyPluginsJSFile =
            filePath.split('/admin/src').filter(p => !!p).length === 1;

          if (
            (event === 'unlinkDir' && !isExtension && shouldCopyPluginsJSFile) ||
            (!isExtension && filePath.includes('plugins.js'))
          ) {
            await createPluginsJs(appPlugins, path.join(cacheDir));
          }
        } catch (err) {
          // Do nothing
        }
      }
    } else {
      // In any other case just copy the file into the .cache folder
      try {
        await fs.copy(filePath, path.join(destFolder, targetPath));
      } catch (err) {
        console.log(err);
      }
    }
  });
}

module.exports = {
  clean,
  build,
  watchAdmin,
};
