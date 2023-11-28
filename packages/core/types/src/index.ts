/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable vars-on-top */
/* eslint-disable no-var */

import type { Database } from '@strapi/database';
import type { Logger } from '@strapi/logger';

import type { Server } from './modules/server';
import type { EventHub } from './modules/event-hub';
import type { CronService } from './modules/cron';
import type { WebhookRunner } from './modules/webhook-runner';
import type { WebhookStore, Webhook } from './modules/webhook-store';
import type { CoreStore } from './modules/core-store';
import type { EntityValidator } from './modules/entity-validator';
import type * as EntityService from './modules/entity-service';
import type * as Documents from './modules/documents';
import type { TelemetryService } from './modules/metrics';
import type { RequestContext } from './modules/request-context';

import type { Common, Shared, Schema, StrapiDirectories } from './types';
import type * as CustomFields from './modules/custom-fields';
import type { Fetch } from './modules/fetch';
import type { AuthenticationService } from './modules/auth';
import type { ContentApi } from './modules/content-api';
import type { SanitizersRegistry } from './modules/sanitizers';
import type { ValidatorsRegistry } from './modules/validators';

import type { Container } from './container';

export type * from './types';

export {
  Container,
  Server,
  EventHub,
  CronService,
  Webhook,
  WebhookRunner,
  WebhookStore,
  CoreStore,
  EntityValidator,
  EntityService,
  Documents,
  TelemetryService,
  RequestContext,
  CustomFields,
  Fetch,
  AuthenticationService,
  ContentApi,
  SanitizersRegistry,
  ValidatorsRegistry,
};

declare global {
  // @ts-expect-error - global strapi variable is also defined in the index.d.ts file
  var strapi: LoadedStrapi;
  namespace NodeJS {
    interface Global {
      // @ts-expect-error - global strapi variable is also defined in the index.d.ts file
      strapi: LoadedStrapi;
    }
  }
}

export interface Reloader {
  isReloading: boolean;
  isWatching: boolean;
  (): void;
}

export interface StartupLogger {
  logStats(): void;
  logFirstStartupMessage(): void;
  logDefaultStartupMessage(): void;
  logStartupMessage({ isInitialized }: { isInitialized: boolean }): void;
}

export interface StrapiFS {
  writeAppFile(optPath: string | string[], data: string): Promise<void>;
  writePluginFile(plugin: string, optPath: string | string[], data: string): Promise<void>;
  removeAppFile(optPath: string | string[]): Promise<void>;
  appendFile(optPath: string | string[], data: string): void;
}

export interface ConfigProvider {
  get<T = unknown>(key: string, defaultVal?: T): T;
  set(path: string, val: unknown): this;
  has(path: string): boolean;
  [key: string]: any;
}

export interface Strapi extends Container {
  server: Server;
  log: Logger;
  fs: StrapiFS;
  eventHub: EventHub;
  startupLogger: StartupLogger;
  cron: CronService;
  webhookRunner?: WebhookRunner;
  webhookStore?: WebhookStore;
  store?: CoreStore;
  entityValidator?: EntityValidator;
  entityService?: EntityService.EntityService;
  documents?: Documents.Repository;
  telemetry: TelemetryService;
  requestContext: RequestContext;
  customFields: CustomFields.CustomFields;
  fetch: Fetch;
  dirs: StrapiDirectories;
  admin?: Common.Module;
  isLoaded: boolean;
  db?: Database;
  app: any;
  EE?: boolean;
  ee: {
    seats: number | null | undefined;
    isEE: boolean;
    features: {
      isEnabled: (feature: string) => boolean;
      list: () => { name: string; [key: string]: any }[];
      get: (feature: string) => { name: string; [key: string]: any };
    };
  };
  components: Shared.Components;
  reload: Reloader;
  config: ConfigProvider;
  services: Record<string, Common.Service>;
  service(uid: Common.UID.Service): Common.Service;
  controllers: Record<string, Common.Controller>;
  controller(uid: Common.UID.Controller): Common.Controller;
  contentTypes: Shared.ContentTypes;
  contentType(name: Common.UID.ContentType): Schema.ContentType;
  policies: Record<string, Common.Policy>;
  policy(name: string): Common.Policy;
  middlewares: Record<string, Common.MiddlewareFactory>;
  middleware(name: string): Common.MiddlewareFactory;
  plugins: Record<string, Common.Plugin>;
  plugin(name: string): Common.Plugin;
  hooks: Record<string, any>;
  hook(name: string): any;
  api: Record<string, Common.Module>;
  auth: AuthenticationService;
  contentAPI: ContentApi;
  sanitizers: SanitizersRegistry;
  validators: ValidatorsRegistry;
  load(): Promise<Strapi & Required<Strapi>>;
  start(): Promise<Strapi>;
  destroy(): Promise<void>;
  sendStartupTelemetry(): void;
  openAdmin({ isInitialized }: { isInitialized: boolean }): void;
  postListen(): Promise<void>;
  listen(): Promise<void>;
  stopWithError(err: unknown, customMessage?: string): never;
  stop(exitCode?: number): never;
  registerInternalHooks(): void;
  register(): Promise<Strapi>;
  bootstrap(): Promise<Strapi>;
  startWebhooks(): Promise<void>;
  runLifecyclesFunctions(lifecycleName: 'register' | 'bootstrap' | 'destroy'): Promise<void>;
  getModel<TUID extends Common.UID.Schema>(
    uid: TUID
  ): TUID extends Common.UID.ContentType ? Schema.ContentType : Schema.Component;
  query(uid: Common.UID.Schema): ReturnType<Database['query']>;
}

export interface StrapiOptions {
  appDir?: string;
  distDir?: string;
  autoReload?: boolean;
  serveAdminPanel?: boolean;
}

export interface StrapiConstructor {
  new (options?: StrapiOptions): Strapi;
}

export type LoadedStrapi = Required<Strapi>;
