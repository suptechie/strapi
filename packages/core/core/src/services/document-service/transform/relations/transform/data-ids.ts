import { isObject, isNil } from 'lodash/fp';

import { EntityService, Attribute, Common } from '@strapi/types';
import { traverseEntity, errors } from '@strapi/utils';

import { ShortHand, LongHand, ID, GetId } from '../utils/types';
import { isShortHand, isLongHand } from '../utils/data';
import { IdMap } from '../../id-map';
import { getRelationTargetLocale } from '../utils/i18n';

const isNumeric = (value: any): value is number => {
  if (Array.isArray(value)) return false; // Handle [1, 'docId'] case
  const parsed = parseInt(value, 10);
  return !Number.isNaN(parsed);
};

const transformPrimitive = <T extends ShortHand | LongHand>(
  relation: T | T[] | null | undefined,
  getId: GetId
): T | T[] | undefined => {
  // TODO: Remove this, we should use the long hand version with 'id' for this case
  // If id value is a number, return it as is, it's already an entry id
  if (isNumeric(relation)) {
    return relation;
  }

  // null
  if (isNil(relation)) {
    return relation as T | undefined;
  }

  // id
  if (isShortHand(relation)) {
    return getId(relation) as T;
  }

  // { id }
  if (isLongHand(relation)) {
    // If the id is already an entry id, return it as is
    if (!('documentId' in relation)) return relation;

    // @ts-expect-error - TODO: Add relation type
    const entryId = getId(relation.documentId, relation.locale) as T;

    // If the id is not found, return undefined
    if (!entryId) return undefined;

    return { ...(relation as object), id: entryId } as T;
  }

  // id[]
  if (Array.isArray(relation)) {
    return relation.map((item) => transformPrimitive(item, getId)).filter(Boolean) as T[];
  }
  return undefined;
};

const transformRelationIdsVisitor = <T extends Attribute.RelationKind.Any>(
  relation: EntityService.Params.Attribute.RelationInputValue<T>,
  getId: GetId
): EntityService.Params.Attribute.RelationInputValue<T> => {
  const map = transformPrimitive(relation as any, getId);
  if (map) return map;

  if (!isObject(relation)) return relation;

  // set: id[]
  // what if result of mapPrimitive is undefined?
  if ('set' in relation) {
    relation.set = transformPrimitive(relation.set as any, getId);
  }
  if ('disconnect' in relation) {
    relation.disconnect = transformPrimitive(relation.disconnect as any, getId);
  }

  if ('connect' in relation) {
    // connect: id[] | { id } | ...
    relation.connect = transformPrimitive(relation.connect as any, getId);

    const mapPosition = (relation: any) => {
      if (isShortHand(relation) || !('position' in relation)) return relation;

      const { position } = relation;

      // { connect: { id: id, position: { before: id } } }
      if (position?.before) {
        const { id } = transformPrimitive({ ...position, documentId: position.before }, getId);
        position.before = id;
      }

      // { connect: { id: id, position: { after: id } } }
      if (position?.after) {
        const { id } = transformPrimitive({ ...position, documentId: position.after }, getId);
        position.after = id;
      }

      return relation;
    };

    if (Array.isArray(relation.connect)) {
      relation.connect = relation.connect.map(mapPosition);
    } else {
      relation.connect = mapPosition(relation.connect);
    }
  }

  return relation;
};

const EXCLUDED_FIELDS = [
  'createdBy',
  'updatedBy',
  'localizations',
  'strapi_stage',
  'strapi_assignee',
];

const transformDataIdsVisitor = (
  idMap: IdMap,
  data: Record<string, any>,
  opts: {
    uid: Common.UID.Schema;
    locale?: string | null;
    isDraft?: boolean;
    allowMissingId?: boolean; // Whether to ignore missing ids and not throw any error
  }
) => {
  return traverseEntity(
    ({ key, value, attribute }, { set }) => {
      // Find relational attributes, and return the document ids
      if (attribute.type === 'relation') {
        const target = attribute.target;
        // TODO: Handle polymorphic relations
        if (!target) return;
        // TODO: Handle this differently
        if (EXCLUDED_FIELDS.includes(key)) return;

        const getId = (documentId: ID, locale?: string): ID | null => {
          const entryId = idMap.get({
            uid: target,
            documentId,
            locale: getRelationTargetLocale(
              { documentId, locale },
              {
                targetUid: target as Common.UID.Schema,
                sourceUid: opts.uid,
                sourceLocale: opts.locale,
              }
            ),
            isDraft: opts.isDraft,
          });

          if (entryId) return entryId;
          if (opts.allowMissingId) return null;

          throw new errors.ValidationError(`Document with id "${documentId}" not found`);
        };

        const newRelation = transformRelationIdsVisitor(value as any, getId);
        set(key, newRelation as any);
      }
    },
    { schema: strapi.getModel(opts.uid) },
    data
  );
};

export { transformDataIdsVisitor };
