import PropTypes from 'prop-types';
import React from 'react';

import { Badge } from '@strapi/design-system/Badge';
import { Box } from '@strapi/design-system/Box';
import { BaseLink } from '@strapi/design-system/BaseLink';
import { Icon } from '@strapi/design-system/Icon';
import { FieldLabel } from '@strapi/design-system/Field';
import { TextButton } from '@strapi/design-system/TextButton';

import Cross from '@strapi/icons/Cross';
import Refresh from '@strapi/icons/Refresh';

import { Relation } from './components/Relation';
import { RelationItem } from './components/RelationItem';
import { RelationList } from './components/RelationList';

import ReactSelect from '../ReactSelect';

export const RelationInput = ({
  name,
  label,
  labelLoadMore,
  relations,
  onRelationRemove,
  onSearch,
}) => {
  return (
    <Box>
      <Relation
        search={
          <>
            <FieldLabel htmlFor="articles-relation">{label}</FieldLabel>
            <ReactSelect inputId="articles-relation" isSearchable onInputChange={onSearch} />
          </>
        }
        loadMore={
          <TextButton onClick={() => {}} startIcon={<Refresh />}>
            {labelLoadMore}
          </TextButton>
        }
      >
        <RelationList>
          {relations.isSuccess &&
            relations.data.pages.flatMap((relation) => {
              const { isDraft, href, title, id } = relation;
              const badgeColor = isDraft ? 'secondary' : 'success';

              return (
                <RelationItem
                  key={`relation-${name}-${id}`}
                  endAction={
                    <button type="button" onClick={() => onRelationRemove(relation)}>
                      <Icon width="12px" as={Cross} />
                    </button>
                  }
                >
                  {href ? <BaseLink href={href}>{title}</BaseLink> : title}

                  <Badge
                    borderSize={1}
                    borderColor={`${badgeColor}200`}
                    backgroundColor={`${badgeColor}100`}
                    textColor={`${badgeColor}700`}
                  >
                    {isDraft ? 'Draft' : 'Published'}
                  </Badge>
                </RelationItem>
              );
            })}
        </RelationList>
      </Relation>
    </Box>
  );
};

const RelationTypeDef = PropTypes.shape({
  id: PropTypes.number.isRequired,
  isDraft: PropTypes.bool,
  href: PropTypes.string,
  title: PropTypes.string.isRequired,
});

const ReactQueryRelationResult = PropTypes.shape({
  data: PropTypes.shape({
    pages: PropTypes.arrayOf(RelationTypeDef),
  }),
  isLoading: PropTypes.bool.isRequired,
  isSuccess: PropTypes.bool.isRequired,
});

const ReactQuerySearchResult = PropTypes.shape({
  data: PropTypes.shape({
    pages: PropTypes.arrayOf(RelationTypeDef),
  }),
  isLoading: PropTypes.bool.isRequired,
  isSuccess: PropTypes.bool.isRequired,
});

RelationInput.defaultProps = {
  relations: [],
  searchResults: [],
  relationsToDisplay: 5,
};

RelationInput.propTypes = {
  // eslint-disable-next-line react/no-unused-prop-types
  description: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  labelLoadMore: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  onRelationAdd: PropTypes.func.isRequired,
  onRelationRemove: PropTypes.func.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  onRelationLoadMore: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  onSearchNextPage: PropTypes.func.isRequired,
  // eslint-disable-next-line react/no-unused-prop-types
  searchResults: PropTypes.arrayOf(ReactQuerySearchResult),
  relations: ReactQueryRelationResult,
  // eslint-disable-next-line react/no-unused-prop-types
  relationsToDisplay: PropTypes.number,
};
