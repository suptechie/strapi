import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { toString } from 'lodash';

import { IcoContainer } from 'strapi-helper-plugin';
import { useListView } from '../../contexts/ListView';

import CustomInputCheckbox from '../CustomInputCheckbox';

import { ActionContainer, Truncate, Truncated } from './styledComponents';

function Row({ isBulkable, row, headers }) {
  const { entriesToDelete, onChangeBulk } = useListView();
  console.log({
    entriesToDelete,
    c: entriesToDelete.filter(id => toString(id) === row.id),
  });
  return (
    <>
      {isBulkable && (
        <td onClick={e => e.stopPropagation()} key="i">
          <CustomInputCheckbox
            name={row.id}
            onChange={onChangeBulk}
            value={
              entriesToDelete.filter(id => toString(id) === toString(row.id))
                .length > 0
            }
          />
        </td>
      )}
      {headers.map(header => {
        //

        return (
          <td key={header.name}>
            <Truncate>
              <Truncated>{row[header.name]}</Truncated>
            </Truncate>
          </td>
        );
      })}
      <ActionContainer>
        <IcoContainer
          icons={[
            { icoType: 'pencil', onClick: () => {} },
            {
              id: row.id,
              icoType: 'trash',
              onClick: () => {},
            },
          ]}
        />
      </ActionContainer>
    </>
  );
}

Row.propTypes = {
  headers: PropTypes.array.isRequired,
  isBulkable: PropTypes.bool.isRequired,
  row: PropTypes.object.isRequired,
};

export default memo(Row);
