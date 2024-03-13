import { prop, uniq, flow } from 'lodash/fp';
import { isOperatorOfType, contentTypes } from '@strapi/utils';
import { type Common, type Entity, type Documents } from '@strapi/types';
import { errors } from '@strapi/utils';
import { getService } from '../utils';
import { validateFindAvailable, validateFindExisting } from './validation/relations';
import { isListable } from '../services/utils/configuration/attributes';

const { PUBLISHED_AT_ATTRIBUTE, UPDATED_AT_ATTRIBUTE } = contentTypes.constants;

interface RelationEntity {
  id: Entity.ID;
  documentId: Documents.ID;
  updatedAt: string | Date;
  publishedAt?: string | Date;
  [key: string]: unknown;
}

const addFiltersClause = (params: any, filtersClause: any) => {
  params.filters = params.filters || {};
  params.filters.$and = params.filters.$and || [];
  params.filters.$and.push(filtersClause);
};

const sanitizeMainField = (model: any, mainField: any, userAbility: any) => {
  const permissionChecker = getService('permission-checker').create({
    userAbility,
    model: model.uid,
  });

  if (!isListable(model, mainField)) {
    return 'id';
  }

  if (permissionChecker.cannot.read(null, mainField)) {
    // Allow reading role name if user can read the user model
    if (model.uid === 'plugin::users-permissions.role') {
      const userPermissionChecker = getService('permission-checker').create({
        userAbility,
        model: 'plugin::users-permissions.user',
      });

      if (userPermissionChecker.can.read()) {
        return 'name';
      }
    }

    return 'id';
  }

  return mainField;
};

export default {
  async extractAndValidateRequestInfo(
    ctx: any,
    id?: Entity.ID,
    locale?: Documents.Params.Locale,
    status?: Documents.Params.PublicationStatus.Kind
  ) {
    const { userAbility } = ctx.state;
    const { model, targetField } = ctx.params;

    const sourceSchema = strapi.getModel(model);
    if (!sourceSchema) {
      throw new errors.ValidationError(`The model ${model} doesn't exist`);
    }

    const attribute: any = sourceSchema.attributes[targetField];
    if (!attribute || attribute.type !== 'relation') {
      throw new errors.ValidationError(
        `The relational field ${targetField} doesn't exist on ${model}`
      );
    }

    const permissionChecker = getService('permission-checker').create({
      userAbility,
      model,
    });

    const isSourceComponent = sourceSchema.modelType === 'component';
    if (!isSourceComponent) {
      if (permissionChecker.cannot.read(null, targetField)) {
        return ctx.forbidden();
      }
    }

    if (id) {
      const where: Record<string, any> = {};

      if (!isSourceComponent) {
        where.documentId = id;

        if (status) {
          where.publishedAt = status === 'published' ? { $ne: null } : null;
        }

        const isSourceLocalized = strapi
          .plugin('i18n')
          .service('content-types')
          .isLocalizedContentType(sourceSchema);
        if (locale && isSourceLocalized) {
          where.locale = locale;
        }
      } else {
        // If the source is a component, we only need to filter by the
        // component's entity id
        where.id = id;
      }

      const permissionQuery = await permissionChecker.sanitizedQuery.read(ctx.query);
      const populate = await getService('populate-builder')(model)
        .populateFromQuery(permissionQuery)
        .build();

      const currentEntity = await strapi.db.query(model).findOne({
        where,
        populate,
      });

      // We need to check if the entity exists
      // and if the user has the permission to read it in this way
      // There may be multiple entities (publication states) under this
      // documentId + locale. We only need to check if one exists
      if (!currentEntity) {
        throw new errors.NotFoundError();
      }

      if (!isSourceComponent) {
        if (permissionChecker.cannot.read(currentEntity, targetField)) {
          throw new errors.ForbiddenError();
        }
      }
    }

    const modelConfig = isSourceComponent
      ? await getService('components').findConfiguration(sourceSchema)
      : await getService('content-types').findConfiguration(sourceSchema);

    const targetSchema = strapi.getModel(attribute.target);

    const mainField = flow(
      prop(`metadatas.${targetField}.edit.mainField`),
      (mainField) => mainField || 'id',
      (mainField) => sanitizeMainField(targetSchema, mainField, userAbility)
    )(modelConfig);

    const fieldsToSelect = uniq([
      mainField,
      PUBLISHED_AT_ATTRIBUTE,
      UPDATED_AT_ATTRIBUTE,
      'documentId',
    ]);

    const isTargetLocalized = strapi
      .plugin('i18n')
      .service('content-types')
      .isLocalizedContentType(targetSchema);

    if (isTargetLocalized) {
      fieldsToSelect.push('locale');
    }

    return {
      attribute,
      fieldsToSelect,
      mainField,
      source: { schema: sourceSchema },
      target: { schema: targetSchema, isLocalized: isTargetLocalized },
      sourceSchema,
      targetSchema,
      targetField,
    };
  },

  async find(ctx: any, id: Entity.ID, available: boolean = true) {
    const locale = ctx.request?.query?.locale || null;
    const status = ctx.request?.query?.status || null;

    const validation = await this.extractAndValidateRequestInfo(ctx, id, locale, status);

    const {
      targetField,
      fieldsToSelect,
      mainField,
      source: {
        schema: { uid: sourceUid, modelType: sourceModelType },
      },
      target: {
        schema: { uid: targetUid },
        isLocalized: isTargetLocalized,
      },
    } = validation;

    const { idsToOmit, idsToInclude, _q, ...query } = ctx.request.query;

    const permissionChecker = getService('permission-checker').create({
      userAbility: ctx.state.userAbility,
      model: targetUid,
    });
    const permissionQuery = await permissionChecker.sanitizedQuery.read(query);

    const queryParams = {
      sort: mainField,
      // cannot select other fields as the user may not have the permissions
      fields: fieldsToSelect,
      ...permissionQuery,
    };

    // If no status is requested, we find all the draft relations and later update them
    // with the latest available status
    addFiltersClause(queryParams, {
      publishedAt: status === 'published' ? { $ne: null } : null,
    });

    // We will only filter by locale if the target content type is localized
    const filterByLocale = isTargetLocalized && locale;
    if (filterByLocale) {
      addFiltersClause(queryParams, { locale });
    }

    if (id) {
      // If finding available relations we want to exclude the
      // ids of entities that are already related to the source.

      // If finding existing we want to include the ids of entities that are
      // already related to the source.

      // We specify the source by entityId for components and by documentId for
      // content types.

      // We also optionally filter the target relations by the requested
      // status and locale if provided.
      const subQuery = strapi.db.queryBuilder(sourceUid);

      // The alias refers to the DB table of the target content type model
      const alias = subQuery.getAlias();

      const where: Record<string, any> = {
        [`${alias}.id`]: { $notNull: true },
        [`${alias}.document_id`]: { $notNull: true },
      };

      const isSourceComponent = sourceModelType === 'component';
      if (isSourceComponent) {
        // If the source is a component, we need to filter by the component's
        // numeric entity id
        where.id = id;
      } else {
        // If the source is a content type, we need to filter by document id
        where.document_id = id;
      }

      // If a status or locale is requested from the source, we need to only
      // ever find relations that match that status or locale.
      if (status) {
        where[`${alias}.published_at`] = status === 'published' ? { $ne: null } : null;
      }
      if (filterByLocale) {
        where[`${alias}.locale`] = locale;
      }

      if ((idsToInclude?.length ?? 0) !== 0) {
        where[`${alias}.document_id`].$notIn = idsToInclude;
      }

      const knexSubQuery = subQuery
        .where(where)
        .join({ alias, targetField })
        .select(`${alias}.id`)
        .getKnexQuery();

      addFiltersClause(queryParams, {
        // We change the operator based on whether we are looking for available or
        // existing relations
        id: available ? { $notIn: knexSubQuery } : { $in: knexSubQuery },
      });
    }

    if (_q) {
      // Apply a filter to the mainField based on the search query and filter operator
      // searching should be allowed only on mainField for permission reasons
      const _filter = isOperatorOfType('where', query._filter) ? query._filter : '$containsi';
      addFiltersClause(queryParams, { [mainField]: { [_filter]: _q } });
    }

    if (idsToOmit?.length > 0) {
      // If we have ids to omit, we should filter them out
      addFiltersClause(queryParams, {
        documentId: { $notIn: uniq(idsToOmit) },
      });
    }

    const res = await strapi.entityService.findPage(
      targetUid as Common.UID.ContentType,
      queryParams
    );

    if (status) {
      // The result will contain all relations in the requested status, and we don't need to find
      // the latest status for each.

      ctx.body = {
        ...res,
        results: res.results.map((relation) => {
          return {
            ...relation,
            status,
          };
        }),
      };
      return;
    }

    // No specific status was requested, we should find the latest available status for each relation
    const documentMetadata = getService('document-metadata');

    // Get any available statuses for the returned relations
    const documentsAvailableStatus = await documentMetadata.getManyAvailableStatus(
      targetUid,
      res.results
    );

    ctx.body = {
      ...res,
      results: res.results.map((relation) => {
        const availableStatuses =
          documentsAvailableStatus.filter(
            (availableDocument: RelationEntity) =>
              availableDocument.documentId === relation.documentId
          ) ?? [];

        return {
          ...relation,
          status: documentMetadata.getStatus(relation, availableStatuses),
        };
      }),
    };
  },

  async findAvailable(ctx: any) {
    const { id } = ctx.request.query;

    await validateFindAvailable(ctx.request.query);
    await this.find(ctx, id, true);
  },

  async findExisting(ctx: any) {
    const { id } = ctx.params;

    await validateFindExisting(ctx.request.query);
    await this.find(ctx, id, false);
  },
};
