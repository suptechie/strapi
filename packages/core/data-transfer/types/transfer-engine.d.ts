import type { IAsset, IEntity, ILink } from './common-entities';
import type { ITransferResults, TransferTransform } from './utils';
import type { ISourceProvider, IDestinationProvider } from './providers';
import type { Schema } from '@strapi/strapi';

/**
 * Defines the capabilities and properties of the transfer engine
 */
export interface ITransferEngine<
  S extends ISourceProvider = ISourceProvider,
  D extends IDestinationProvider = IDestinationProvider
> {
  /**
   * Provider used as a source which that will stream its data to the transfer engine
   */
  sourceProvider: ISourceProvider;
  /**
   * Provider used as a destination that will receive its data from the transfer engine
   */
  destinationProvider: IDestinationProvider;
  /**
   * The options used to customize the behavio of the transfer engine
   */
  options: ITransferEngineOptions;

  /**
   * Runs the integrity check which will make sure it's possible
   * to transfer data from the source to the provider.
   *
   * Note: It requires to read the content of the source & destination metadata files
   */
  integrityCheck(): Promise<boolean>;

  /**
   * Start streaming selected data from the source to the destination
   */
  transfer(): Promise<ITransferResults<S, D>>;

  /**
   * Run the bootstrap lifecycle method of each provider
   *
   * Note: The bootstrap method can be used to initialize database
   * connections, open files, etc...
   */
  bootstrap(): Promise<void>;

  /**
   * Engine init step. Must be called after the providers bootstrap.
   */
  init(): Promise<void>;

  /**
   * Run the close lifecycle method of each provider
   *
   * Note: The close method can be used to gracefully close connections, cleanup the filesystem, etc..
   */
  close(): Promise<void>;

  /**
   * Run the preparations before starting a transfer for each provider
   *
   * related source and destination providers
   */
  beforeTransfer(): Promise<void>;

  /**
   * Start the schemas transfer by connecting the
   * related source and destination providers streams
   */
  transferSchemas(): Promise<void>;

  /**
   * Start the entities transfer by connecting the
   * related source and destination providers streams
   */
  transferEntities(): Promise<void>;

  /**
   * Start the links transfer by connecting the
   * related source and destination providers streams
   */
  transferLinks(): Promise<void>;

  /**
   * Start the asset transfer by connecting the
   * related source and destination providers streams
   */
  transferAssets(): Promise<void>;

  /**
   * Start the configuration transfer by connecting the
   * related source and destination providers streams
   */
  transferConfiguration(): Promise<void>;
}

/**
 * Options used to customize the TransferEngine behavior
 *
 * Note: Please add your suggestions. Also, we'll need to consider matching what is
 * written for the CLI with those options at one point
 *
 * Note: here, we're listing the TransferEngine options, not the individual providers' options
 */
export interface ITransferEngineOptions {
  /**
   * What kind of version matching should be done between the source and the destination metadata?
   * @example
   * "exact" // must be a strict equality, whatever the format used
   * "ignore" // do not check if versions match
   * "major" // only the major version should match. 4.3.9 and 4.4.1 will work, while 3.3.2 and 4.3.2 won't
   * "minor" // both the major and minor version should match. 4.3.9 and 4.3.11 will work, while 4.3.9 and 4.4.1 won't
   * "patch" // every part of the version should match. Similar to "exact" but only work on semver.
   */
  versionStrategy: 'exact' | 'ignore' | 'major' | 'minor' | 'patch';

  /**
   * Strategy used to do the schema matching in the integrity checks
   */
  schemaStrategy: 'exact' | 'strict' | 'ignore';

  // List of rules to integrate into the final pipelines
  transforms?: {
    global?: TransferTransform<unknown>[];
    schemas?: TransferTransform<Schema>[];
    entities?: TransferTransform<IEntity>[];
    links?: TransferTransform<ILink>[];
    assets?: TransferTransform<IAsset>[];
    configuration?: TransferTransform<unknown>[];
  };
}
