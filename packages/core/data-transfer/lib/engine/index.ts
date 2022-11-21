import { PassThrough } from 'stream-chain';
import type {
  Diff,
  IDestinationProvider,
  IMetadata,
  ISourceProvider,
  ITransferEngine,
  ITransferEngineOptions,
  ITransferResults,
  TransferStage,
} from '../../types';

import { isEmpty, uniq, has } from 'lodash/fp';

import compareSchemas from '../strategies';

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

type TransferEngineProgress = {
  data: any;
  stream: PassThrough;
};

export const VALID_STRATEGIES = ['restore', 'merge'];

class TransferEngine<
  S extends ISourceProvider = ISourceProvider,
  D extends IDestinationProvider = IDestinationProvider
> implements ITransferEngine
{
  sourceProvider: ISourceProvider;
  destinationProvider: IDestinationProvider;
  options: ITransferEngineOptions;
  #metadata: { source?: IMetadata; destination?: IMetadata } = {};

  #transferProgress: TransferProgress = {};
  // TODO: Type the stream chunks. Doesn't seem trivial, especially since PassThrough doesn't provide a PassThroughOptions type
  #progressStream: PassThrough = new PassThrough({ objectMode: true });
  get progress(): TransferEngineProgress {
    return {
      data: this.#transferProgress,
      stream: this.#progressStream,
    };
  }

  constructor(
    sourceProvider: ISourceProvider,
    destinationProvider: IDestinationProvider,
    options: ITransferEngineOptions
  ) {
    if (sourceProvider.type !== 'source') {
      throw new Error("SourceProvider does not have type 'source'");
    }
    if (destinationProvider.type !== 'destination') {
      throw new Error("SourceProvider does not have type 'source'");
    }
    this.sourceProvider = sourceProvider;
    this.destinationProvider = destinationProvider;
    this.options = options;
  }

  #increaseTransferProgress(transferStage: TransferStage, data: any, aggregateKey?: string) {
    if (!this.#transferProgress[transferStage]) {
      this.#transferProgress[transferStage] = { count: 0, bytes: 0 };
    }
    this.#transferProgress[transferStage]!.count += 1;
    const size = JSON.stringify(data).length;
    this.#transferProgress[transferStage]!.bytes! += size;

    if (aggregateKey && data && data[aggregateKey]) {
      const aggKeyValue = data[aggregateKey];
      if (!this.#transferProgress[transferStage]!['aggregates']) {
        this.#transferProgress[transferStage]!.aggregates = {};
      }
      if (
        !(
          this.#transferProgress[transferStage]!.aggregates &&
          this.#transferProgress[transferStage]!.aggregates![aggKeyValue]
        )
      ) {
        this.#transferProgress[transferStage]!.aggregates![aggKeyValue] = { count: 0, bytes: 0 };
      }
      this.#transferProgress[transferStage]!.aggregates![aggKeyValue].count += 1;
      this.#transferProgress[transferStage]!.aggregates![aggKeyValue].bytes! += size;
    }
  }

  #countRecorder = (transferStage: TransferStage, aggregateKey?: string) => {
    return new PassThrough({
      objectMode: true,
      transform: (data, _encoding, callback) => {
        this.#increaseTransferProgress(transferStage, data, aggregateKey);
        this.#updateStage('progress', transferStage);
        callback(null, data);
      },
    });
  };

  #updateStage = (type: 'start' | 'complete' | 'progress', transferStage: TransferStage) => {
    this.#progressStream.emit(type, {
      data: this.#transferProgress,
      stage: transferStage,
    });
  };

  #assertStrapiVersionIntegrity(sourceVersion?: string, destinationVersion?: string) {
    const strategy = this.options.versionMatching;

    if (!sourceVersion || !destinationVersion) {
      return;
    }

    if (strategy === 'ignore') {
      return;
    }

    if (strategy === 'exact' && sourceVersion === destinationVersion) {
      return;
    }

    const sourceTokens = sourceVersion.split('.');
    const destinationTokens = destinationVersion.split('.');

    const [major, minor, patch] = sourceTokens.map(
      (value, index) => value === destinationTokens[index]
    );

    if (
      (strategy === 'major' && major) ||
      (strategy === 'minor' && major && minor) ||
      (strategy === 'patch' && major && minor && patch)
    ) {
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
      if (error instanceof Error) {
        console.error('Integrity checks failed:', error.message);
      }

      return false;
    }
  }

  validateTransferOptions() {
    if (!VALID_STRATEGIES.includes(this.options.strategy)) {
      throw new Error('Invalid stategy ' + this.options.strategy);
    }
  }

  async transfer(): Promise<ITransferResults<S, D>> {
    try {
      this.validateTransferOptions();

      await this.bootstrap();
      await this.init();

      const isValidTransfer = await this.integrityCheck();

      if (!isValidTransfer) {
        throw new Error(
          `Unable to transfer the data between ${this.sourceProvider.name} and ${this.destinationProvider.name}.\nPlease refer to the log above for more information.`
        );
      }

      // Run the transfer stages
      await this.transferSchemas();
      await this.transferEntities();
      await this.transferMedia();
      await this.transferLinks();
      await this.transferConfiguration();

      // Gracefully close the providers
      await this.close();
    } catch (e: any) {
      throw e;
      // Rollback the destination provider if an exception is thrown during the transfer
      // Note: This will be configurable in the future
      // await this.destinationProvider?.rollback(e);
    }

    return {
      source: this.sourceProvider.results,
      destination: this.destinationProvider.results,
    };
  }

  async transferSchemas(): Promise<void> {
    const stageName: TransferStage = 'schemas';

    const inStream = await this.sourceProvider.streamSchemas?.();
    if (!inStream) {
      // console.log('SourceProvider did not return a schemas stream');
      return;
    }

    const outStream = await this.destinationProvider.getSchemasStream?.();
    if (!outStream) {
      // console.log('DestinationProvider did not return a schemas stream');
      return;
    }

    this.#updateStage('start', stageName);
    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#updateStage('complete', stageName);
          resolve();
        });

      inStream.pipe(this.#countRecorder(stageName)).pipe(outStream);
    });
  }

  async transferEntities(): Promise<void> {
    const stageName: TransferStage = 'entities';

    const inStream = await this.sourceProvider.streamEntities?.();
    if (!inStream) {
      // console.log('SourceProvider did not return entities stream');
      return;
    }

    const outStream = await this.destinationProvider.getEntitiesStream?.();
    if (!outStream) {
      // console.log('DestinationProvider did not return entities stream');
      return;
    }

    this.#updateStage('start', stageName);

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
          this.#updateStage('complete', stageName);
          resolve();
        });

      inStream.pipe(this.#countRecorder(stageName, 'type')).pipe(outStream);
    });
  }

  async transferLinks(): Promise<void> {
    const stageName: TransferStage = 'links';

    const inStream = await this.sourceProvider.streamLinks?.();
    if (!inStream) {
      // console.log('SourceProvider did not return a links stream');
      return;
    }

    const outStream = await this.destinationProvider.getLinksStream?.();
    if (!outStream) {
      //console.log('DestinationProvider did not return a links stream');
      return;
    }

    this.#updateStage('start', 'links');

    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#updateStage('complete', stageName);
          resolve();
        });

      inStream.pipe(this.#countRecorder(stageName)).pipe(outStream);
    });
  }

  async transferMedia(): Promise<void> {
    const stageName: TransferStage = 'media';
    this.#updateStage('start', stageName);
    console.warn('transferMedia not yet implemented');
    return new Promise((resolve) =>
      (() => {
        this.#updateStage('complete', stageName);
        resolve();
      })()
    );
  }

  async transferConfiguration(): Promise<void> {
    const stageName: TransferStage = 'configuration';

    const inStream = await this.sourceProvider.streamConfiguration?.();
    if (!inStream) {
      // console.log('SourceProvider did not return configuration stream');
      return;
    }

    const outStream = await this.destinationProvider.getConfigurationStream?.();
    if (!outStream) {
      // console.log('DestinationProvider did not return configuration stream');
      return;
    }

    this.#updateStage('start', stageName);

    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#updateStage('complete', stageName);
          resolve();
        });

      inStream.pipe(this.#countRecorder(stageName)).pipe(outStream);
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
