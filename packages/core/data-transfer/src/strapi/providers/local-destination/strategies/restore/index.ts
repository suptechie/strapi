import type { Schema } from '@strapi/strapi';
import { ProviderTransferError } from '../../../../../errors/providers';
import * as queries from '../../../../queries';

export interface IRestoreOptions {
  assets?: boolean; // delete media library files before transfer
  configuration?: {
    webhook?: boolean; // delete webhooks before transfer
    coreStore?: boolean; // delete core store before transfer
  };
  entities?: {
    include?: string[]; // only delete these stage entities before transfer
    exclude?: string[]; // exclude these stage entities from deletion
    filters?: ((contentType: Schema.ContentType) => boolean)[]; // custom filters to exclude a content type from deletion
    params?: { [uid: string]: unknown }; // params object passed to deleteMany before transfer for custom deletions
  };
}

interface IDeleteResults {
  count: number;
  aggregate: { [uid: string]: { count: number } };
}

export const deleteRecords = async (strapi: Strapi.Loaded, options: IRestoreOptions) => {
  const entities = await deleteEntitiesRecords(strapi, options);
  const configuration = await deleteConfigurationRecords(strapi, options);

  return {
    count: entities.count + configuration.count,
    entities,
    configuration,
  };
};

const deleteEntitiesRecords = async (
  strapi: Strapi.Loaded,
  options: IRestoreOptions = {}
): Promise<IDeleteResults> => {
  const { entities } = options;
  const query = queries.entity.createEntityQuery(strapi);
  const contentTypes = Object.values<Schema.ContentType>(
    strapi.contentTypes as Record<string, Schema.ContentType>
  );

  const contentTypesToClear = contentTypes.filter((contentType) => {
    let removeThisContentType = true;

    // include means "only include these types" so if it's not in here, it's not being included
    if (entities?.include) {
      removeThisContentType = entities.include.includes(contentType.uid);
    }

    // if something is excluded, remove it. But lack of being excluded doesn't mean it's kept
    if (entities?.exclude && entities.exclude.includes(contentType.uid)) {
      removeThisContentType = false;
    }

    if (entities?.filters) {
      removeThisContentType = entities.filters.every((filter) => filter(contentType));
    }

    return removeThisContentType;
  });

  const [results, updateResults] = useResults(
    contentTypesToClear.map((contentType) => contentType.uid)
  );

  const deletePromises = contentTypesToClear.map(async (contentType) => {
    const result = await query(contentType.uid).deleteMany(entities?.params);

    if (result) {
      updateResults(result.count || 0, contentType.uid);
    }
  });

  await Promise.all(deletePromises);

  return results;
};

const deleteConfigurationRecords = async (
  strapi: Strapi.Loaded,
  options: IRestoreOptions = {}
): Promise<IDeleteResults> => {
  const { coreStore = true, webhook = true } = options?.configuration ?? {};

  const models: string[] = [];

  if (coreStore) {
    models.push('strapi::core-store');
  }

  if (webhook) {
    models.push('webhook');
  }

  const [results, updateResults] = useResults(models);

  const deletePromises = models.map(async (uid) => {
    const result = await strapi.db.query(uid).deleteMany({});

    if (result) {
      updateResults(result.count, uid);
    }
  });

  await Promise.all(deletePromises);

  return results;
};

const useResults = (
  keys: string[]
): [IDeleteResults, (count: number, key?: string) => void | never] => {
  const results: IDeleteResults = {
    count: 0,
    aggregate: keys.reduce((acc, key) => ({ ...acc, [key]: { count: 0 } }), {}),
  };

  const update = (count: number, key?: string) => {
    if (key) {
      if (!(key in results.aggregate)) {
        throw new ProviderTransferError(`Unknown key "${key}" provided in results update`);
      }

      results.aggregate[key].count += count;
    }

    results.count += count;
  };

  return [results, update];
};

export * from './entities';
export * from './configuration';
export * from './links';
