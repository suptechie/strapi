import koaIp from 'koa-ip';
import type { Common } from '@strapi/typings';

export type Config = koaIp.KoaIPOptions;

export const ip: Common.MiddlewareFactory<Config> = (config) => koaIp(config);
