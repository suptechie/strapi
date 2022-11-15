import type { IMedia, IMetadata, ISourceProvider, ProviderType } from '../../../types';

import { chain } from 'stream-chain';
import { Readable } from 'stream';
import { createEntitiesStream, createEntitiesTransformStream } from './entities';
import { createLinksStream } from './links';
import { createConfigurationStream } from './configuration';

export interface ILocalStrapiSourceProviderOptions {
  getStrapi(): Strapi.Strapi | Promise<Strapi.Strapi>;

  autoDestroy?: boolean;
}

export const createLocalStrapiSourceProvider = (options: ILocalStrapiSourceProviderOptions) => {
  return new LocalStrapiSourceProvider(options);
};

class LocalStrapiSourceProvider implements ISourceProvider {
  name: string = 'source::local-strapi';
  type: ProviderType = 'source';

  options: ILocalStrapiSourceProviderOptions;
  strapi?: Strapi.Strapi;

  constructor(options: ILocalStrapiSourceProviderOptions) {
    this.options = options;
  }

  async bootstrap(): Promise<void> {
    this.strapi = await this.options.getStrapi();
  }

  async close(): Promise<void> {
    const { autoDestroy } = this.options;

    // Basically `!== false` but more deterministic
    if (autoDestroy === undefined || autoDestroy === true) {
      await this.strapi?.destroy();
    }
  }

  getMetadata(): IMetadata {
    console.log(strapi.plugin('graphql').config('version'));

    const strapiVersion = strapi.config.get('info.strapi');
    const createdAt = new Date().toISOString();

    const plugins = Object.keys(strapi.plugins);

    return {
      createdAt,
      strapi: {
        version: strapiVersion,
        plugins: plugins.map((name) => ({
          name,
          // TODO: Get the plugin actual version when it'll be available
          version: strapiVersion,
        })),
      },
    };
  }

  async streamEntities(): Promise<NodeJS.ReadableStream> {
    if (!this.strapi) {
      throw new Error('Not able to stream entities. Strapi instance not found');
    }

    return chain([
      // Entities stream
      createEntitiesStream(this.strapi),
      // Transform stream
      createEntitiesTransformStream(),
    ]);
  }

  streamLinks(): NodeJS.ReadableStream {
    if (!this.strapi) {
      throw new Error('Not able to stream links. Strapi instance not found');
    }

    return createLinksStream(this.strapi);
  }

  streamConfiguration(): NodeJS.ReadableStream {
    if (!this.strapi) {
      throw new Error('Not able to stream configuration. Strapi instance not found');
    }

    return createConfigurationStream(strapi);
  }

  getSchemas() {
    if (!this.strapi) {
      throw new Error('Not able to get Schemas. Strapi instance not found');
    }

    return [...Object.values(this.strapi.contentTypes), ...Object.values(this.strapi.components)];
  }

  streamSchemas(): NodeJS.ReadableStream {
    return Readable.from(this.getSchemas());
  }
}
