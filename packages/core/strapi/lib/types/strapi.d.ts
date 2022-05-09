import type Koa from 'koa';

import type { StringMap } from './utils';

type Controller = {
  [methodName: string | number | symbol]: (context: Koa.Context) => unknown;
}

/**
 * The Strapi interface implemented by the main Strapi class.
 */
export interface Strapi {
  /**
   * Getter for the Strapi enterprise edition configuration
   */
  readonly EE: unknown;

  /**
   * Getter for the Strapi configuration container
   */
  readonly config: unknown;

  /**
   * Getter for the Strapi auth container
   */
  readonly auth: unknown;

  /**
   * Getter for the Strapi services container
   *
   * It returns all the registered services
   */
  readonly services: StringMap<Service>;

  /**
   * Find a service using its unique identifier
   */
  service<T extends Service = unknown>(uid: string): T | undefined;

  /**
   * Getter for the Strapi controllers container
   *
   * It returns all the registered controllers
   */
  readonly controllers: StringMap<Controller>;

  /**
   * Find a controller using its unique identifier
   */
  controller(uid: string): Controller | undefined;

  /**
   * Getter for the Strapi content types container
   *
   * It returns all the registered content types
   */
  readonly contentTypes: unknown;

  /**
   * Find a content type using its unique identifier
   */
  contentType(uid: string): unknown;

  /**
   * Getter for the Strapi policies container
   *
   * It returns all the registered policies
   */
  readonly policies: unknown;

  /**
   * Find a policy using its name
   */
  policy(name: string): unknown;

  /**
   * Getter for the Strapi middlewares container
   *
   * It returns all the registered middlewares
   */
  readonly middlewares: unknown;

  /**
   * Find a middleware using its name
   */
  middleware(): unknown;

  /**
   * Getter for the Strapi plugins container
   *
   * It returns all the registered plugins
   */
  readonly plugins: unknown;

  /**
   * Find a plugin using its name
   */
  plugin(name: string): unknown;

  /**
   * Getter for the Strapi hooks container
   *
   * It returns all the registered hooks
   */
  readonly hooks: unknown;

  /**
   * Find a hook using its name
   */
  hook(): unknown;

  /**
   * Getter for the Strapi APIs container
   *
   * It returns all the registered APIs
   */
  readonly api: unknown;

  /**
   * Strapi Register Lifecycle.
   *
   * - Load
   *   - The user application
   *   - The plugins
   *   - The admin
   *   - The APIs
   *   - The components
   *   - The middlewares
   *   - The policies
   * - Trigger Strapi internal bootstrap
   * - Create the webhooks runner
   * - Create the internal hooks registry.
   * - Init the telemetry cron job and middleware
   * - Run all the `register` lifecycle methods loaded by the user application or the enabled plugins
   */
  register(): Promise<Strapi>;

  /**
   * Bootstraping phase.
   *
   * - Load all the content types
   * - Initialize the database layer
   * - Initialize the entity service
   * - Run the schemas/database synchronization
   * - Start the webhooks and initializing middlewares and routes
   * - Run all the `bootstrap` lifecycle methods loaded by the
   * user application or the enabled plugins
   */
  bootstrap(): Promise<Strapi>;

  /**
   * Destroy phase
   *
   * - Destroy Strapi server
   * - Run all the `destroy` lifecycle methods loaded by the
   * user application or the enabled plugins
   * - Cleanup the event hub
   * - Gracefully stop the database
   * - Stop the telemetry and cron instance
   * - Cleanup the global scope by removing global.strapi
   */
  destroy(): Promise<void>;

  /**
   * Run all functions registered for a given lifecycle. (Strapi core, user app, plugins)
   */
  runLifecyclesFunctions<T extends Lifecycles[keyof Lifecycles]>(lifecycleName: T): Promise<void>;

  /**
   * Load the application if needed and start the server
   */
  start(): Promise<void>;

  /**
   * Stop the server and provide a custom error and message
   */
  stopWithError<TError = unknown>(error: TError, customMessage?: string): void;

  /**
   * Gracefully stop the server
   * Call the destroy method.
   */
  stop(code?: number): void;

  /**
   * Load the server and the user application.
   * It basically triggers the register and bootstrap phases
   */
  load(): Promise<Strapi>;

  /**
   * Restart the server and reload all the configuration.
   * It re-runs all the lifecycles phases.
   * 
   * @example
   * ``` ts
   * setImmediate(() => strapi.reload());
   * ```
   */
  reload(): () => void;

  /**
   * Initialize and start all the webhooks registered in the webhook store
   */
  startWebhooks(): Promise<void>;

  /**
   * Method called when the server is fully initialized and listen to incomming requests.
   * It handles tasks such as logging the startup message
   * or automatically opening the administration panel.
   */
  postListen(): Promise<void>;

  /**
   * Start listening for incomming requests
   */
  listen(): Promise<void | Error>;

  /**
   * Opent he administration panel in a browser if the option is enabled.
   * You can disable it using the admin.autoOpen configuration variable.
   * 
   * Note: It only works in development envs.
   */
  openAdmin(options: { isInitialized: boolean }): Promise<void>;

  /**
   * Load the admin panel server logic into the server code and initialize its configuration. 
   */
  loadAdmin(): Promise<void>;

  /**
   * Resolve every enabled plugin and load them into the application.
   */
  loadPlugins(): Promise<void>;

  /**
   * Load every global policies in the policies container by
   * reading from the `strapi.dirs.dist.policies` directory.
   */
  loadPolicies(): Promise<void>;

  /**
   * Load every APIs and their components (config, routes, controllers, services,
   * policies, middlewares, content-types) in the API container.
   */
  loadAPIs(): Promise<void>;

  /**
   * Resolve every components in the user application and store them in `strapi.components`
   */
  loadComponents(): Promise<void>;

  /**
   * Load every global and core middlewares in the middlewares container by
   * reading from the `strapi.dirs.dist.middlewares` and internal middlewares directory.
   */
  loadMiddlewares(): Promise<void>;

  /**
   * Load the user application in the server by reading the `src/index.js` file.
   */
  loadApp(): Promise<void>;

  /**
   * Add internal hooks to the hooks container.
   * Those hooks are meant for internal usage and might break in future releases.
   */
  registerInternalHooks(): void;

  /**
   * Find a model (content-type, component) based on its unique identifier.
   */
  getModel(uid: string): unknown;

  /**
   * Binds database queries for a specific model based on its unique identifier.
   */
  query(uid: string): unknown;
}

export interface Lifecycles {
  REGISTER: 'register';
  BOOTSTRAP: 'bootstrap';
  DESTROY: 'destroy';
}
