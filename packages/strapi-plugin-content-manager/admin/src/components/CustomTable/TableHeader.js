import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { useGlobalContext } from 'strapi-helper-plugin';
import { useListView } from '../../hooks';

import CustomInputCheckbox from '../CustomInputCheckbox';
import { Arrow, Thead } from './styledComponents';

/* eslint-disable jsx-a11y/control-has-associated-label */

function TableHeader({ headers, isBulkable }) {
  const {
    data,
    entriesToDelete,
    onChangeBulkSelectall,
    _sort,
    firstSortableHeader,
    setQuery,
  } = useListView();
  const { emitEvent } = useGlobalContext();
  const [sortBy, sortOrder] = _sort.split(':');

  return (
    <Thead isBulkable={isBulkable}>
      <tr>
        {isBulkable && (
          <th>
            <CustomInputCheckbox
              entriesToDelete={entriesToDelete}
              isAll
              name="all"
              onChange={onChangeBulkSelectall}
              value={data.length === entriesToDelete.length && entriesToDelete.length > 0}
            />
          </th>
        )}
        {headers.map(
          ({ key, name, fieldSchema: { type }, metadatas: { label, sortable, mainField } }) => {
            let sortField = name;

            if (type === 'relation') {
              sortField = `${name}.${mainField}`;
            }

            return (
              <th
                key={key}
                onClick={() => {
                  if (sortable) {
                    emitEvent('didSortEntries');

                    const isCurrentSort = sortField === sortBy;
                    const nextOrder = isCurrentSort && sortOrder === 'ASC' ? 'DESC' : 'ASC';
                    let value = `${sortField}:${nextOrder}`;

                    if (isCurrentSort && sortOrder === 'DESC') {
                      value = `${firstSortableHeader}:ASC`;
                    }

                    setQuery({
                      _sort: value,
                    });
                  }
                }}
              >
                <span className={sortable ? 'sortable' : ''}>
                  {label}

                  {sortBy === sortField && (
                    <Arrow fill="#212529" isUp={sortOrder === 'ASC' && 'isAsc'} />
                  )}
                </span>
              </th>
            );
          }
        )}
        <th />
      </tr>
    </Thead>
  );
}

TableHeader.defaultProps = {
  isBulkable: true,
  headers: [],
};

TableHeader.propTypes = {
  headers: PropTypes.array,
  isBulkable: PropTypes.bool,
};

export default memo(TableHeader);
