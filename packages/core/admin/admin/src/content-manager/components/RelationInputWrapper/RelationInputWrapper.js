import PropTypes from 'prop-types';
import React, { memo, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useCMEditViewDataManager, NotAllowedInput } from '@strapi/helper-plugin';

import { RelationInput } from '../RelationInput';
import { useRelation } from '../../hooks/useRelation';
import { connect, select, normalizeRelations } from './utils';
import { PUBLICATION_STATES } from './constants';
import { getTrad } from '../../utils';

export const RelationInputWrapper = ({
  editable,
  description,
  intlLabel,
  isCreatingEntry,
  isFieldAllowed,
  isFieldReadable,
  labelAction,
  mainField,
  name,
  queryInfos: { endpoints, defaultParams, shouldDisplayRelationLink },
  placeholder,
  relationType,
  targetModel,
}) => {
  const { formatMessage } = useIntl();
  const { connectRelation, disconnectRelation, loadRelation, modifiedData, slug, initialData } =
    useCMEditViewDataManager();

  const { relations, search, searchFor } = useRelation(`${slug}-${name}-${initialData?.id ?? ''}`, {
    relation: {
      endpoint: endpoints.relation,
      onLoad(data) {
        loadRelation({ target: { name, value: data.results } });
      },
      pageParams: {
        ...defaultParams,
        pageSize: 10,
      },
    },

    search: {
      endpoint: endpoints.search,
      pageParams: {
        ...defaultParams,
        // entityId: isCreatingEntry ? undefined : initialData.id,
        pageSize: 10,
      },
    },
  });

  const isMorph = useMemo(() => relationType.toLowerCase().includes('morph'), [relationType]);
  const isSingleRelation = [
    'oneWay',
    'oneToOne',
    'manyToOne',
    'oneToManyMorph',
    'oneToOneMorph',
  ].includes(relationType);

  const isDisabled = useMemo(() => {
    if (isMorph) {
      return true;
    }

    if (!isCreatingEntry) {
      return (!isFieldAllowed && isFieldReadable) || !editable;
    }

    return !editable;
  }, [isMorph, isCreatingEntry, editable, isFieldAllowed, isFieldReadable]);

  const handleRelationAdd = (relation) => {
    if (isSingleRelation) {
      // TODO remove all relations from relations before
    }

    connectRelation({ target: { name, value: relation } });
  };

  const handleRelationRemove = (relation) => {
    disconnectRelation({ target: { name, value: relation } });
  };

  const handleRelationLoadMore = () => {
    relations.fetchNextPage();
  };

  const handleSearch = (term) => {
    searchFor(term, { omitIds: modifiedData?.[name]?.connect?.map((relation) => relation.id) });
  };

  const handleSearchMore = () => {
    search.fetchNextPage();
  };

  if (
    (!isFieldAllowed && isCreatingEntry) ||
    (!isCreatingEntry && !isFieldAllowed && !isFieldReadable)
  ) {
    return <NotAllowedInput intlLabel={intlLabel} labelAction={labelAction} />;
  }

  return (
    <RelationInput
      description={description}
      disabled={isDisabled}
      id={name}
      label={formatMessage(intlLabel)}
      labelLoadMore={
        // TODO: only display if there are more; derive from count
        !isCreatingEntry &&
        formatMessage({
          id: getTrad('relation.loadMore'),
          defaultMessage: 'Load More',
        })
      }
      listHeight={320}
      loadingMessage={() =>
        formatMessage({
          id: getTrad('relation.isLoading'),
          defaultMessage: 'Relations are loading',
        })
      }
      name={name}
      numberOfRelationsToDisplay={5}
      onRelationAdd={(relation) => handleRelationAdd(relation)}
      onRelationRemove={(relation) => handleRelationRemove(relation)}
      onRelationLoadMore={() => handleRelationLoadMore()}
      onSearch={(term) => handleSearch(term)}
      onSearchNextPage={() => handleSearchMore()}
      onSearchClose={() => {}}
      onSearchOpen={() => {}}
      placeholder={formatMessage(
        placeholder || {
          id: getTrad('relation.add'),
          defaultMessage: 'Add relation',
        }
      )}
      publicationStateTranslations={{
        [PUBLICATION_STATES.DRAFT]: formatMessage({
          id: getTrad('relation.publicationState.draft'),
          defaultMessage: 'Draft',
        }),

        [PUBLICATION_STATES.PUBLISHED]: formatMessage({
          id: getTrad('relation.publicationState.published'),
          defaultMessage: 'Published',
        }),
      }}
      relations={normalizeRelations(relations, {
        modifiedData: modifiedData?.[name],
        mainFieldName: mainField.name,
        shouldAddLink: shouldDisplayRelationLink,
        targetModel,
      })}
      searchResults={normalizeRelations(search, {
        mainFieldName: mainField.name,
      })}
    />
  );
};

RelationInputWrapper.defaultProps = {
  editable: true,
  description: '',
  labelAction: null,
  isFieldAllowed: true,
  placeholder: null,
};

RelationInputWrapper.propTypes = {
  editable: PropTypes.bool,
  description: PropTypes.string,
  intlLabel: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  }).isRequired,
  labelAction: PropTypes.element,
  isCreatingEntry: PropTypes.bool.isRequired,
  isFieldAllowed: PropTypes.bool,
  isFieldReadable: PropTypes.bool.isRequired,
  mainField: PropTypes.shape({
    name: PropTypes.string.isRequired,
    schema: PropTypes.shape({
      type: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  }),
  relationType: PropTypes.string.isRequired,
  targetModel: PropTypes.string.isRequired,
  queryInfos: PropTypes.shape({
    defaultParams: PropTypes.shape({
      _component: PropTypes.string,
    }),
    endpoints: PropTypes.shape({
      relation: PropTypes.string,
      search: PropTypes.string.isRequired,
    }).isRequired,
    shouldDisplayRelationLink: PropTypes.bool.isRequired,
  }).isRequired,
};

const Memoized = memo(RelationInputWrapper);

export default connect(Memoized, select);
