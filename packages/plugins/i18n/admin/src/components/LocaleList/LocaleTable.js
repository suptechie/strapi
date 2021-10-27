import React from 'react';
import PropTypes from 'prop-types';
import { TableLabel, Text } from '@strapi/design-system/Text';
import { IconButton } from '@strapi/design-system/IconButton';
import { Stack } from '@strapi/design-system/Stack';
import { VisuallyHidden } from '@strapi/design-system/VisuallyHidden';
import { Table, Thead, Tr, Th, Td, Tbody } from '@strapi/design-system/Table';
import Pencil from '@strapi/icons/Pencil';
import Trash from '@strapi/icons/Trash';
import { useIntl } from 'react-intl';
import { stopPropagation, onRowClick } from '@strapi/helper-plugin';

import { getTrad } from '../../utils';

const LocaleTable = ({ locales, onDeleteLocale, onEditLocale }) => {
  const { formatMessage } = useIntl();

  return (
    <Table colCount={4} rowCount={locales.length + 1}>
      <Thead>
        <Tr>
          <Th>
            <TableLabel textColor="neutral600">
              {formatMessage({ id: getTrad('Settings.locales.row.id') })}
            </TableLabel>
          </Th>
          <Th>
            <TableLabel textColor="neutral600">
              {formatMessage({ id: getTrad('Settings.locales.row.displayName') })}
            </TableLabel>
          </Th>
          <Th>
            <TableLabel textColor="neutral600">
              {formatMessage({ id: getTrad('Settings.locales.row.default-locale') })}
            </TableLabel>
          </Th>
          <Th>
            <VisuallyHidden>Actions</VisuallyHidden>
          </Th>
        </Tr>
      </Thead>
      <Tbody>
        {locales.map(locale => (
          <Tr
            key={locale.id}
            {...onRowClick({
              fn: () => onEditLocale(locale),
              condition: onEditLocale,
            })}
          >
            <Td>
              <Text textColor="neutral800">{locale.id}</Text>
            </Td>
            <Td>
              <Text textColor="neutral800">{locale.name}</Text>
            </Td>
            <Td>
              <Text textColor="neutral800">
                {locale.isDefault
                  ? formatMessage({ id: getTrad('Settings.locales.row.default-locale') })
                  : null}
              </Text>
            </Td>
            <Td>
              <Stack
                horizontal
                size={1}
                style={{ justifyContent: 'flex-end' }}
                {...stopPropagation}
              >
                {onEditLocale && (
                  <IconButton
                    onClick={() => onEditLocale(locale)}
                    label={formatMessage({ id: getTrad('Settings.list.actions.edit') })}
                    icon={<Pencil />}
                    noBorder
                  />
                )}
                {onDeleteLocale && !locale.isDefault && (
                  <IconButton
                    onClick={() => onDeleteLocale(locale)}
                    label={formatMessage({ id: getTrad('Settings.list.actions.delete') })}
                    icon={<Trash />}
                    noBorder
                  />
                )}
              </Stack>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

LocaleTable.defaultProps = {
  locales: [],
  onDeleteLocale: undefined,
  onEditLocale: undefined,
};

LocaleTable.propTypes = {
  locales: PropTypes.array,
  onDeleteLocale: PropTypes.func,
  onEditLocale: PropTypes.func,
};

export default LocaleTable;
