'use strict';

// Dependencies.
const http = require('http');
const path = require('path');
const { EventEmitter } = require('events');
const fse = require('fs-extra');
const Koa = require('koa');
const Router = require('koa-router');
const _ = require('lodash');
const { logger, models } = require('strapi-utils');
const chalk = require('chalk');
const CLITable = require('cli-table3');

const utils = require('./utils');
const {
  loadConfig,
  loadApis,
  loadAdmin,
  loadPlugins,
  loadMiddlewares,
  loadHooks,
  bootstrap,
  loadExtensions,
  loadComponents,
} = require('./core');
const initializeMiddlewares = require('./middlewares');
const initializeHooks = require('./hooks');
const createStrapiFs = require('./core/fs');
const getPrefixedDeps = require('./utils/get-prefixed-dependencies');

const createEventHub = require('./services/event-hub');
const createWebhookRunner = require('./services/webhook-runner');
const {
  webhookModel,
  createWebhookStore,
} = require('./services/webhook-store');
const { createCoreStore, coreStoreModel } = require('./services/core-store');
const createEntityService = require('./services/entity-service');
const { createDatabaseManager } = require('strapi-database');

const CONFIG_PATHS = {
  admin: 'admin',
  api: 'api',
  config: 'config',
  controllers: 'controllers',
  models: 'models',
  plugins: 'plugins',
  policies: 'policies',
  tmp: '.tmp',
  services: 'services',
  static: 'public',
  validators: 'validators',
  views: 'views',
};

/**
 * Construct an Strapi instance.
 *
 * @constructor
 */

class Strapi extends EventEmitter {
  constructor(opts = {}) {
    super();

    this.setMaxListeners(100);

    this.reload = this.reload();

    // Expose `koa`.
    this.app = new Koa();
    this.router = new Router();

    // Mount the HTTP server.
    this.server = http.createServer(this.app.callback());

    // Logger.
    this.log = logger;

    // Utils.
    this.utils = {
      models,
    };

    this.dir = opts.dir || process.cwd();
    this.admin = {};
    this.plugins = {};
    this.config = this.initConfig(opts);

    // internal services.
    this.fs = createStrapiFs(this);
    this.eventHub = createEventHub();

    this.requireProjectBootstrap();
  }

  initConfig({ autoReload = false, serveAdminPanel = true } = {}) {
    const pkgJSON = require(path.resolve(this.dir, 'package.json'));

    const config = {
      serveAdminPanel,
      launchedAt: Date.now(),
      appPath: this.dir,
      autoReload,
      host: process.env.HOST || process.env.HOSTNAME || 'localhost',
      port: process.env.PORT || 1337,
      environment: _.toLower(process.env.NODE_ENV) || 'development',
      environments: {},
      admin: {},
      paths: CONFIG_PATHS,
      middleware: {},
      hook: {},
      functions: {},
      routes: {},
      info: pkgJSON,
      installedPlugins: getPrefixedDeps('strapi-plugin', pkgJSON),
      installedMiddlewares: getPrefixedDeps('strapi-middleware', pkgJSON),
      installedHooks: getPrefixedDeps('strapi-hook', pkgJSON),
    };

    Object.defineProperty(config, 'get', {
      value(path, defaultValue = null) {
        return _.get(config, path, defaultValue);
      },
      enumerable: false,
      configurable: false,
      writable: false,
    });

    Object.defineProperty(config, 'set', {
      value(path, value) {
        return _.set(config, path, value);
      },
      enumerable: false,
      configurable: false,
      writable: false,
    });

    return config;
  }

  requireProjectBootstrap() {
    const bootstrapPath = path.resolve(
      this.dir,
      'config/functions/bootstrap.js'
    );

    if (fse.existsSync(bootstrapPath)) {
      require(bootstrapPath);
    }
  }

  logStats() {
    const columns = Math.min(process.stderr.columns, 80) - 2;
    console.log();
    console.log(chalk.black.bgWhite(_.padEnd(' Project information', columns)));
    console.log();

    const infoTable = new CLITable({
      colWidths: [20, 50],
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
    });

    infoTable.push(
      [chalk.blue('Time'), `${new Date()}`],
      [chalk.blue('Launched in'), Date.now() - this.config.launchedAt + ' ms'],
      [chalk.blue('Environment'), this.config.environment],
      [chalk.blue('Process PID'), process.pid],
      [
        chalk.blue('Version'),
        `${this.config.info.strapi} (node v${this.config.info.node})`,
      ]
    );

    console.log(infoTable.toString());
    console.log();
    console.log(chalk.black.bgWhite(_.padEnd(' Actions available', columns)));
    console.log();
  }

  logFirstStartupMessage() {
    this.logStats();

    console.log(chalk.bold('One more thing...'));
    console.log(
      chalk.grey(
        'Create your first administrator 💻 by going to the administration panel at:'
      )
    );
    console.log();

    const addressTable = new CLITable();
    addressTable.push([chalk.bold(this.config.admin.url)]);
    console.log(`${addressTable.toString()}`);
    console.log();
  }

  logStartupMessage() {
    this.logStats();

    console.log(chalk.bold('Welcome back!'));

    if (this.config.serveAdminPanel === true) {
      console.log(
        chalk.grey(
          'To manage your project 🚀, go to the administration panel at:'
        )
      );
      console.log(chalk.bold(this.config.admin.url));
      console.log();
    }

    console.log(chalk.grey('To access the server ⚡️, go to:'));
    console.log(chalk.bold(this.config.url));
    console.log();
  }

  async start(cb) {
    try {
      // Emit starting event.
      this.emit('server:starting');

      await this.load();

      // Run bootstrap function.
      await this.runBootstrapFunctions();
      // Freeze object.
      await this.freeze();
      // Is the project initialised?
      const isInitialised = await utils.isInitialised(this);

      this.app.use(this.router.routes()).use(this.router.allowedMethods());

      // Launch server.
      this.server.listen(this.config.port, async err => {
        if (err) return this.stopWithError(err);

        if (!isInitialised) {
          this.logFirstStartupMessage();
        } else {
          this.logStartupMessage();
        }

        // Emit started event.
        this.emit('server:started');

        if (cb && typeof cb === 'function') {
          cb();
        }

        if (
          (this.config.environment === 'development' &&
            _.get(
              this.config.currentEnvironment,
              'server.admin.autoOpen',
              true
            ) !== false) ||
          !isInitialised
        ) {
          await utils.openBrowser.call(this);
        }
      });
    } catch (err) {
      this.stopWithError(err);
    }
  }

  /**
   * Add behaviors to the server
   */
  async enhancer() {
    // handle port in use cleanly
    this.server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        return this.stopWithError(
          `The port ${err.port} is already used by another application.`
        );
      }

      this.log.error(err);
    });

    // Close current connections to fully destroy the server
    const connections = {};

    this.server.on('connection', conn => {
      const key = conn.remoteAddress + ':' + conn.remotePort;
      connections[key] = conn;

      conn.on('close', function() {
        delete connections[key];
      });
    });

    this.server.destroy = cb => {
      this.server.close(cb);

      for (let key in connections) {
        connections[key].destroy();
      }
    };
  }

  stopWithError(err) {
    this.log.debug(`⛔️ Server wasn't able to start properly.`);
    this.log.error(err);
    return this.stop();
  }

  stop(exitCode = 1) {
    // Destroy server and available connections.
    this.server.destroy();

    if (this.config.autoReload) {
      process.send('stop');
    }

    // Kill process.
    process.exit(exitCode);
  }

  async load() {
    await this.enhancer();

    this.app.use(async (ctx, next) => {
      if (ctx.request.url === '/_health' && ctx.request.method === 'HEAD') {
        ctx.set('strapi', 'You are so French!');
        ctx.status = 204;
      } else {
        await next();
      }
    });

    const [
      config,
      api,
      admin,
      plugins,
      middlewares,
      hook,
      extensions,
      components,
    ] = await Promise.all([
      loadConfig(this),
      loadApis(this),
      loadAdmin(this),
      loadPlugins(this),
      loadMiddlewares(this),
      loadHooks(this.config),
      loadExtensions(this.config),
      loadComponents(this),
    ]);

    _.merge(this.config, config);

    this.api = api;
    this.admin = admin;
    this.components = components;
    this.plugins = plugins;
    this.middleware = middlewares;
    this.hook = hook;

    /**
     * Handle plugin extensions
     */
    // merge extensions config folders
    _.mergeWith(this.plugins, extensions.merges, (objValue, srcValue, key) => {
      // concat routes
      if (_.isArray(srcValue) && _.isArray(objValue) && key === 'routes') {
        return srcValue.concat(objValue);
      }
    });
    // overwrite plugins with extensions overwrites
    extensions.overwrites.forEach(({ path, mod }) => {
      _.assign(_.get(this.plugins, path), mod);
    });

    // Populate AST with configurations.

    await bootstrap(this);

    // Usage.
    await utils.usage(this.config);

    // init webhook runner
    this.webhookRunner = createWebhookRunner({
      eventHub: this.eventHub,
      logger: this.log,
      configuration: this.config.get('currentEnvironment.server.webhooks', {}),
    });

    // Init core store
    this.models['core_store'] = coreStoreModel;
    this.models['strapi_webhooks'] = webhookModel;

    this.db = createDatabaseManager(this);
    await this.db.initialize();

    this.store = createCoreStore({
      environment: this.config.environment,
      db: this.db,
    });

    this.webhookStore = createWebhookStore({ db: this.db });

    await this.startWebhooks();

    this.entityService = createEntityService({
      db: this.db,
      eventHub: this.eventHub,
    });

    // Initialize hooks and middlewares.
    await initializeMiddlewares.call(this);
    await initializeHooks.call(this);
  }

  async startWebhooks() {
    const webhooks = await this.webhookStore.findWebhooks();
    webhooks.forEach(webhook => this.webhookRunner.add(webhook));
  }

  reload() {
    const state = {
      shouldReload: 0,
    };

    const reload = function() {
      if (state.shouldReload > 0) {
        // Reset the reloading state
        state.shouldReload -= 1;
        reload.isReloading = false;
        return;
      }

      if (this.config.autoReload) {
        this.server.close();
        process.send('reload');
      }
    };

    Object.defineProperty(reload, 'isWatching', {
      configurable: true,
      enumerable: true,
      set: value => {
        // Special state when the reloader is disabled temporarly (see GraphQL plugin example).
        if (state.isWatching === false && value === true) {
          state.shouldReload += 1;
        }
        state.isWatching = value;
      },
      get: () => {
        return state.isWatching;
      },
    });

    reload.isReloading = false;
    reload.isWatching = true;

    return reload;
  }

  async runBootstrapFunctions() {
    const timeoutMs = this.config.bootstrapTimeout || 3500;
    const warnOnTimeout = () =>
      setTimeout(() => {
        this.log.warn(
          `The bootstrap function is taking unusually long to execute (${timeoutMs} miliseconds).`
        );
        this.log.warn('Make sure you call it?');
      }, timeoutMs);

    async function execBootstrap(fn) {
      if (!fn) return;

      const timer = warnOnTimeout();
      try {
        await fn();
      } finally {
        clearTimeout(timer);
      }
    }

    const pluginBoostraps = Object.keys(this.plugins).map(plugin => {
      return execBootstrap(
        _.get(this.plugins[plugin], 'config.functions.bootstrap')
      ).catch(err => {
        strapi.log.error(`Bootstrap function in plugin "${plugin}" failed`);
        strapi.log.error(err);
        strapi.stop();
      });
    });

    await Promise.all(pluginBoostraps);

    return execBootstrap(_.get(this.config, ['functions', 'bootstrap']));
  }

  async freeze() {
    Object.freeze(this.config);
    Object.freeze(this.dir);
    Object.freeze(this.admin);
    Object.freeze(this.plugins);
    Object.freeze(this.api);
  }

  getModel(modelKey, plugin) {
    return this.db.getModel(modelKey, plugin);
  }

  /**
   * Binds queries with a specific model
   * @param {string} entity - entity name
   * @param {string} plugin - plugin name or null
   */
  query(entity, plugin) {
    return this.db.query(entity, plugin);
  }
}

module.exports = options => {
  const strapi = new Strapi(options);
  global.strapi = strapi;
  return strapi;
};
