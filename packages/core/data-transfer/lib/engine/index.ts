import _ from 'lodash/fp';
import { PassThrough } from 'stream-chain';
import type {
  IDestinationProvider,
  ISourceProvider,
  ITransferEngine,
  ITransferEngineOptions,
  ITransferResults,
} from '../../types';

type TransferAction =
  | 'entities'
  | 'schemas'
  | 'configuration'
  | 'media'
  | 'links'
  | 'close'
  | 'schemaCheck'
  | 'bootstrap'
  | 'close';

type TransferProgress = {
  [key in TransferAction]?: {
    count: number;
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

  // TODO: add typings
  transferProgress: TransferProgress = {};

  #progressStream: PassThrough = new PassThrough({ objectMode: true });
  get progressStream() {
    return this.#progressStream;
  }

  constructor(
    sourceProvider: ISourceProvider,
    destinationProvider: IDestinationProvider,
    options: ITransferEngineOptions
  ) {
    this.sourceProvider = sourceProvider;
    this.destinationProvider = destinationProvider;
    this.options = options;
  }

  incrementTransferProgress(name: TransferAction, ...args: Array<string>) {
    if (!_.has(name, this.transferProgress)) {
      this.transferProgress[name] = { count: 0 };
    }
    this.transferProgress[name]!.count++;
  }

  countRecorder = (name: TransferAction) => {
    return new PassThrough({
      objectMode: true,
      transform: (data, encoding, callback) => {
        this.incrementTransferProgress(name);
        this.#progressStream.write({
          type: 'progress',
          name,
          data: this.transferProgress,
        });
        callback();
      },
    });
  };

  #updateStep = (type: 'start' | 'complete', name: TransferAction) => {
    this.progressStream.write({
      type,
      data: this.transferProgress,
      name,
    });
  };

  private assertStrapiVersionIntegrity(sourceVersion?: string, destinationVersion?: string) {
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
      `Strapi versions doesn't match (${strategy} check): ${sourceVersion} does not match with ${destinationVersion} `
    );
  }

  async boostrap(): Promise<void> {
    const stepName: TransferAction = 'bootstrap';
    this.#updateStep('start', stepName);

    await Promise.all([
      // bootstrap source provider
      this.sourceProvider.bootstrap?.(),
      // bootstrap destination provider
      this.destinationProvider.bootstrap?.(),
    ]);

    this.#updateStep('complete', stepName);
  }

  async close(): Promise<void> {
    const stepName: TransferAction = 'close';
    this.#updateStep('start', stepName);
    await Promise.all([
      // close source provider
      this.sourceProvider.close?.(),
      // close destination provider
      this.destinationProvider.close?.(),
    ]);

    this.#updateStep('complete', stepName);
  }

  async integrityCheck(): Promise<boolean> {
    const sourceMetadata = await this.sourceProvider.getMetadata();
    const destinationMetadata = await this.destinationProvider.getMetadata();

    if (!sourceMetadata || !destinationMetadata) {
      return true;
    }

    try {
      // Version check
      this.assertStrapiVersionIntegrity(
        sourceMetadata?.strapi?.version,
        destinationMetadata?.strapi?.version
      );

      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Integrity checks failed:', error.message);
      }

      return false;
    }
  }

  async transfer(): Promise<ITransferResults<S, D>> {
    try {
      await this.boostrap();

      const isValidTransfer = await this.integrityCheck();

      if (!isValidTransfer) {
        throw new Error(
          `Unable to transfer the data between ${this.sourceProvider.name} and ${this.destinationProvider.name}.\nPlease refer to the log above for more information.`
        );
      }
      await this.transferSchemas();
      await this.transferEntities();
      await this.transferMedia();
      await this.transferLinks();
      await this.transferConfiguration();
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
    const stepName: TransferAction = 'schemas';
    const inStream = await this.sourceProvider.streamSchemas?.();
    const outStream = await this.destinationProvider.getSchemasStream?.();

    if (!inStream) {
      throw new Error('Unable to transfer schemas, source stream is missing');
    }

    if (!outStream) {
      throw new Error('Unable to transfer schemas, destination stream is missing');
    }

    this.#updateStep('start', stepName);
    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#updateStep('complete', stepName);
          resolve();
        });

      inStream.pipe(this.countRecorder(stepName)).pipe(outStream);
    });
  }

  async transferEntities(): Promise<void> {
    const stepName: TransferAction = 'entities';
    const inStream = await this.sourceProvider.streamEntities?.();
    const outStream = await this.destinationProvider.getEntitiesStream?.();

    if (!inStream) {
      throw new Error('Unable to transfer entities, source stream is missing');
    }

    if (!outStream) {
      throw new Error('Unable to transfer entities, destination stream is missing');
    }

    this.#updateStep('start', stepName);

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
          this.#updateStep('complete', stepName);
          resolve();
        });

      inStream.pipe(this.countRecorder(stepName)).pipe(outStream);
    });
  }

  async transferLinks(): Promise<void> {
    const stepName: TransferAction = 'links';
    const inStream = await this.sourceProvider.streamLinks?.();
    const outStream = await this.destinationProvider.getLinksStream?.();

    if (!inStream) {
      throw new Error('Unable to transfer links, source stream is missing');
    }

    if (!outStream) {
      throw new Error('Unable to transfer links, destination stream is missing');
    }

    this.#updateStep('start', 'links');

    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#updateStep('complete', stepName);
          resolve();
        });

      inStream.pipe(this.countRecorder(stepName)).pipe(outStream);
    });
  }

  async transferMedia(): Promise<void> {
    const stepName: TransferAction = 'media';
    this.#updateStep('start', stepName);
    console.warn('transferMedia not yet implemented');
    return new Promise((resolve) =>
      (() => {
        this.#updateStep('complete', stepName);
        resolve();
      })()
    );
  }

  async transferConfiguration(): Promise<void> {
    const stepName: TransferAction = 'configuration';
    const inStream = await this.sourceProvider.streamConfiguration?.();
    const outStream = await this.destinationProvider.getConfigurationStream?.();

    if (!inStream) {
      throw new Error('Unable to transfer configuration, source stream is missing');
    }

    if (!outStream) {
      throw new Error('Unable to transfer configuration, destination stream is missing');
    }

    this.#updateStep('start', stepName);

    return new Promise((resolve, reject) => {
      inStream
        // Throw on error in the source
        .on('error', reject);

      outStream
        // Throw on error in the destination
        .on('error', reject)
        // Resolve the promise when the destination has finished reading all the data from the source
        .on('close', () => {
          this.#updateStep('complete', stepName);
          resolve();
        });

      inStream.pipe(this.countRecorder(stepName)).pipe(outStream);
    });
  }
}

export const createTransferEngine = <S extends ISourceProvider, D extends IDestinationProvider>(
  sourceProvider: S,
  destinationProvider: D,
  options: ITransferEngineOptions
): TransferEngine<S, D> => {
  return new TransferEngine<S, D>(sourceProvider, destinationProvider, options);
};
