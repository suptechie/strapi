import React from 'react';
import PropTypes from 'prop-types';
import { BaseCheckbox, Box, IconButton, Tbody, Td, Text, Tr, Row } from '@strapi/parts';
import { EditIcon, DeleteIcon, Duplicate } from '@strapi/icons';
import { useTracking } from '@strapi/helper-plugin';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { usePluginsQueryParams } from '../../../hooks';
// import { Tooltip } from '@strapi/parts/Tooltip';
// import toString from 'lodash/toString';

const TableRows = ({
  canCreate,
  canDelete,
  headers,
  entriesToDelete,
  onClickDelete,
  onSelectRow,
  withMainAction,
  withBulkActions,
  rows,
}) => {
  const {
    push,
    location: { pathname },
  } = useHistory();
  const { formatMessage } = useIntl();
  const { trackUsage } = useTracking();
  const pluginsQueryParams = usePluginsQueryParams();

  return (
    <Tbody>
      {rows.map((data, index) => {
        const isChecked = entriesToDelete.findIndex(id => id === data.id) !== -1;
        const itemLineText = formatMessage(
          {
            id: 'content-manager.components.DynamicTable.row-line',
            defaultMessage: 'item line {number}',
          },
          { number: index }
        );

        return (
          <Tr key={data.id}>
            {withMainAction && (
              <Td>
                <BaseCheckbox
                  aria-label={formatMessage(
                    {
                      id: 'app.component.table.select.one-entry',
                      defaultMessage: `Select {target}`,
                    },
                    { target: `${data.firstname} ${data.lastname}` }
                  )}
                  checked={isChecked}
                  onChange={() => {
                    onSelectRow({ name: data.id, value: !isChecked });
                  }}
                />
              </Td>
            )}
            {headers.map(({ key, cellFormatter, name, ...rest }) => {
              return (
                <Td key={key}>
                  {typeof cellFormatter === 'function' ? (
                    cellFormatter(data, { key, name, ...rest })
                  ) : (
                    <Text textColor="neutral800">{data[name] || '-'}</Text>
                  )}
                </Td>
              );
            })}

            {withBulkActions && (
              <Td>
                <Row justifyContent="end">
                  <IconButton
                    onClick={() => {
                      trackUsage('willEditEntryFromButton');
                      push({
                        pathname: `${pathname}/${data.id}`,
                        state: { from: pathname },
                        search: pluginsQueryParams,
                      });
                    }}
                    label={formatMessage(
                      { id: 'app.component.table.edit', defaultMessage: 'Edit {target}' },
                      { target: itemLineText }
                    )}
                    noBorder
                    icon={<EditIcon />}
                  />

                  {canCreate && (
                    <Box paddingLeft={1}>
                      <IconButton
                        onClick={() => {
                          push({
                            pathname: `${pathname}/create/clone${data.id}`,
                            state: { from: pathname },
                            search: pluginsQueryParams,
                          });
                        }}
                        label={formatMessage(
                          {
                            id: 'app.component.table.duplicate',
                            defaultMessage: 'Duplicate {target}',
                          },
                          { target: itemLineText }
                        )}
                        noBorder
                        icon={<Duplicate />}
                      />
                    </Box>
                  )}

                  {canDelete && (
                    <Box paddingLeft={1}>
                      <IconButton
                        onClick={() => onClickDelete(data.id)}
                        label={formatMessage(
                          { id: 'app.component.table.delete', defaultMessage: 'Delete {target}' },
                          { target: itemLineText }
                        )}
                        noBorder
                        icon={<DeleteIcon />}
                      />
                    </Box>
                  )}
                </Row>
              </Td>
            )}
          </Tr>
        );
      })}
    </Tbody>
  );
};

TableRows.defaultProps = {
  canCreate: false,
  canDelete: false,
  entriesToDelete: [],
  onClickDelete: () => {},
  onSelectRow: () => {},
  rows: [],
  withBulkActions: false,
  withMainAction: false,
};

TableRows.propTypes = {
  canCreate: PropTypes.bool,
  canDelete: PropTypes.bool,
  entriesToDelete: PropTypes.array,
  headers: PropTypes.array.isRequired,
  onClickDelete: PropTypes.func,
  onSelectRow: PropTypes.func,
  rows: PropTypes.array,
  withBulkActions: PropTypes.bool,
  withMainAction: PropTypes.bool,
};

export default TableRows;
