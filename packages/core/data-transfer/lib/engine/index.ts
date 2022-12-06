import { PassThrough, Stream } from 'stream-chain';
import * as path from 'path';
import { isEmpty, uniq } from 'lodash/fp';
import type { Schema } from '@strapi/strapi';

import type {
  Diff,
  IAsset,
  IDestinationProvider,
  IEntity,
  IMetadata,
  ISourceProvider,
  ITransferEngine,
  ITransferEngineOptions,
  ITransferResults,
  TransferStage,
} from '../../types';

import compareSchemas from '../strategies';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const semverDiff = require('semver/functions/diff');

type TransferProgress = {
  [key in TransferStage]?: {
    count: number;
    bytes: number;
    aggregates?: {
      [key: string]: {
        count: number;
        bytes: number;
      };
    };
  };
};

class TransferEngine<
  S extends ISourceProvider = ISourceProvider,
  D extends IDestinationProvider = IDestinationProvider
> implements ITransferEngine
{
  sourceProvider: ISourceProvider;

  destinationProvider: IDestinationProvider;

  options: ITransferEngineOptions;

  #metadata: { source?: IMetadata; destination?: IMetadata } = {};

  progress: {
    data: TransferProgress;
    stream: PassThrough;
  };

  constructor(
    sourceProvider: ISourceProvider,
    destinationProvider: IDestinationProvider,
    options: ITransferEngineOptions
  ) {
    if (sourceProvider.type !== 'source') {
      throw new Error("SourceProvider does not have type 'source'");
    }
    if (destinationProvider.type !== 'destination') {
      throw new Error("DestinationProvider does not have type 'destination'");
    }
    this.sourceProvider = sourceProvider;
    this.destinationProvider = destinationProvider;
    this.options = options;

    this.progress = { data: {}, stream: new PassThrough() };
  }

  #updateTransferProgress<T = unknown>(
    stage: TransferStage,
    data: T,
    aggregate?: {
      size?: (value: T) => number;
      key?: (value: T) => string;
    }
  ) {
    if (!this.progress.data[stage]) {
      this.progress.data[stage] = { count: 0, bytes: 0 };
    }

    const stageProgress = this.progress.data[stage]!;

    const size = aggregate?.size?.(data) ?? JSON.stringify(data).length;
    const key = aggregate?.key?.(data);

    stageProgress.count += 1;
    stageProgress.bytes += size;

    // Handle aggregate updates if necessary
    if (key) {
      if (!stageProgress.aggregates) {
        stageProgress.aggregates = {};
      }

      const { aggregates } = stageProgress;

      if (!aggregates[key]) {
        aggregates[key] = { count: 0, bytes: 0 };
      }

      aggregates[key].count += 1;
      aggregates[key].bytes += size;
    }
  }

  #progressTracker(
    stage: TransferStage,
    aggregate?: {
      size?(value: unknown): number;
      key?(value: unknown): string;
    }
  ) {
    return new PassThrough({
      objectMode: true,
      transform: (data, _encoding, callback) => {
        this.#updateTransferProgress(stage, data, aggregate);
        this.#emitStageUpdate('progress', stage);
        callback(null, data);
      },
    });
  }

  #emitStageUpdate(type: 'start' | 'complete' | 'progress', transferStage: TransferStage) {
    this.progress.stream.emit(type, {
      data: this.progress.data,
      stage: transferStage,
    });
  }

  #assertStrapiVersionIntegrity(sourceVersion?: string, destinationVersion?: string) {
    const strategy = this.options.versionMatching;

    if (
      !sourceVersion ||
      !destinationVersion ||
      strategy === 'ignore' ||
      destinationVersion === sourceVersion
    ) {
      return;
    }

    let diff;
    try {
      diff = semverDiff(sourceVersion, destinationVersion);
    } catch (e: unknown) {
      throw new Error(
        `Strapi versions doesn't match (${strategy} check): ${sourceVersion} does not match with ${destinationVersion}`
      );
    }
    if (!diff) {
      return;
    }

    const validPatch = ['prelease', 'build'];
    const validMinor = [...validPatch, 'patch', 'prepatch'];
    const validMajor = [...validMinor, 'minor', 'preminor'];
    if (strategy === 'patch' && validPatch.includes(diff)) {
      return;
    }
    if (strategy === 'minor' && validMinor.includes(diff)) {
      return;
    }
    if (strategy === 'major' && validMajor.includes(diff)) {
      return;
    }

    throw new Error(
      `Strapi versions doesn't match (${strategy} check): ${sourceVersion} does not match with ${destinationVersion}`
    );
  }

  #assertSchemasMatching(sourceSchemas: any, destinationSchemas: any) {
    const strategy = this.options.schemasMatching || 'strict';
    const keys = uniq(Object.keys(sourceSchemas).concat(Object.keys(destinationSchemas)));
    const diffs: { [key: string]: Diff[] } = {};

    keys.forEach((key) => {
      const sourceSchema = sourceSchemas[key];
      const destinationSchema = destinationSchemas[key];
      const schemaDiffs = compareSchemas(sourceSchema, destinationSchema, strategy);

      if (schemaDiffs.length) {
        diffs[key] = schemaDiffs;
      }
    });

    if (!isEmpty(diffs)) {
      throw new Error(
        `Import process failed because the project doesn't have a matching data structure 
        ${JSON.stringify(diffs, null, 2)}
        `
      );
    }
  }

  async init(): Promise<void> {
    // Resolve providers' resource and store
    // them in the engine's internal state
    await this.#resolveProviderResource();

    // Update the destination provider's source metadata
    const { source: sourceMetadata } = this.#metadata;

    if (sourceMetadata) {
      this.destinationProvider.setMetadata?.('source', sourceMetadata);
    }
  }

  async bootstrap(): Promise<void> {
    await Promise.all([this.sourceProvider.bootstrap?.(), this.destinationProvider.bootstrap?.()]);
  }

  async close(): Promise<void> {
    await Promise.all([this.sourceProvider.close?.(), this.destinationProvider.close?.()]);
  }

  async #resolveProviderResource() {
    const sourceMetadata = await this.sourceProvider.getMetadata();
    const destinationMetadata = await this.destinationProvider.getMetadata();

    if (sourceMetadata) {
      this.#metadata.source = sourceMetadata;
    }

    if (destinationMetadata) {
      this.#metadata.destination = destinationMetadata;
    }
  }

  async integrityCheck(): Promise<boolean> {
    try {
      const sourceMetadata = await this.sourceProvider.getMetadata();
      const destinationMetadata = await this.destinationProvider.getMetadata();

      if (sourceMetadata && destinationMetadata) {
        this.#assertStrapiVersionIntegrity(
          sourceMetadata?.strapi?.version,
          destinationMetadata?.strapi?.version
        );
      }

      const sourceSchemas = await this.sourceProvider.getSchemas?.();
      const destinationSchemas = await this.destinationProvider.getSchemas?.();

      if (sourceSchemas && destinationSchemas) {
        this.#assertSchemasMatching(sourceSchemas, destinationSchemas);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async transfer(): Promise<ITransferResults<S, D>> {
    try {
      await this.bootstrap();
      await this.init();

      const isValidTransfer = await this.integrityCheck();

      if (!isValidTransfer) {
        // TODO: provide the log from the integrity check
        throw new Error(
          `Unable to transfer the data between ${this.sourceProvider.name} and ${this.destinationProvider.name}.\nPlease refer to the log above for more information.`
        );
      }

      await this.beforeTransfer();
      // Run the transfer stages
      await this.transferSchemas();
      await this.transferEntities();
      await this.transferAssets();
      await this.transferLinks();
      await this.transferConfiguration();

      // Gracefully close the providers
      await this.close();
    } catch (e: unknown) {
      // Rollback the destination provider if an exception is thrown during the transfer
      // Note: This will be configurable in the future
      await this.destinationProvider.rollback?.(e as Error);
      throw e;
    }

    return {
      source: this.sourceProvider.results,
      destination: this.destinationProvider.results,
      engine: this.progress.data,
    };
  }

  async beforeTransfer(): Promise<void> {
    await this.sourceProvider.beforeTransfer?.();
    await this.destinationProvider.beforeTransfer?.();
  }

  async transferSchemas(): Promise<void> {
    const stageName: TransferStage = 'schemas';

    const inStream = await this.sourceProvider.streamSchemas?.();
    if (!inStream) {
      return;
    }

    const outStream = await this.destinationProvider.getSchemasStream?.();
    if (!outStream) {
      return;
    }

    this.#emitStageUpdate('start', stageName);
    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#emitStageUpdate('complete', stageName);
          resolve();
        });

      inStream
        .pipe(this.#progressTracker(stageName, { key: (value: Schema) => value.modelType }))
        .pipe(outStream);
    });
  }

  async transferEntities(): Promise<void> {
    const stageName: TransferStage = 'entities';

    const inStream = await this.sourceProvider.streamEntities?.();
    if (!inStream) {
      return;
    }

    const outStream = await this.destinationProvider.getEntitiesStream?.();
    if (!outStream) {
      return;
    }

    this.#emitStageUpdate('start', stageName);

    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', (e) => {
          reject(e);
        });

      outStream
        // Throw on error in the destination
        .on('error', (e) => {
          reject(e);
        })
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#emitStageUpdate('complete', stageName);
          resolve();
        });

      inStream
        .pipe(this.#progressTracker(stageName, { key: (value: IEntity) => value.type }))
        .pipe(outStream);
    });
  }

  async transferLinks(): Promise<void> {
    const stageName: TransferStage = 'links';

    const inStream = await this.sourceProvider.streamLinks?.();
    if (!inStream) {
      return;
    }

    const outStream = await this.destinationProvider.getLinksStream?.();
    if (!outStream) {
      return;
    }

    this.#emitStageUpdate('start', 'links');

    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#emitStageUpdate('complete', stageName);
          resolve();
        });

      inStream.pipe(this.#progressTracker(stageName)).pipe(outStream);
    });
  }

  async transferAssets(): Promise<void> {
    const stageName: TransferStage = 'assets';
    const inStream = await this.sourceProvider.streamAssets?.();
    if (!inStream) {
      return;
    }

    const outStream = await this.destinationProvider.getAssetsStream?.();
    if (!outStream) {
      return;
    }

    this.#emitStageUpdate('start', stageName);

    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#emitStageUpdate('complete', stageName);
          resolve();
        });

      inStream
        .pipe(
          this.#progressTracker(stageName, {
            size: (value: IAsset) => value.stats.size,
            key: (value: IAsset) => path.extname(value.filename),
          })
        )
        .pipe(outStream);
    });
  }

  async transferConfiguration(): Promise<void> {
    const stageName: TransferStage = 'configuration';

    const inStream = await this.sourceProvider.streamConfiguration?.();
    if (!inStream) {
      return;
    }

    const outStream = await this.destinationProvider.getConfigurationStream?.();
    if (!outStream) {
      return;
    }

    this.#emitStageUpdate('start', stageName);

    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#emitStageUpdate('complete', stageName);
          resolve();
        });

      inStream.pipe(this.#progressTracker(stageName)).pipe(outStream);
    });
  }
}

export const createTransferEngine = <
  S extends ISourceProvider = ISourceProvider,
  D extends IDestinationProvider = IDestinationProvider
>(
  sourceProvider: S,
  destinationProvider: D,
  options: ITransferEngineOptions
): TransferEngine<S, D> => {
  return new TransferEngine<S, D>(sourceProvider, destinationProvider, options);
};
