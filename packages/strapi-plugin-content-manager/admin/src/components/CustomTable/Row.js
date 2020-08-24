import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { get, isEmpty, isNull, isObject, toLower, toString } from 'lodash';
import moment from 'moment';
import { useGlobalContext } from 'strapi-helper-plugin';
import { IconLinks, Text } from '@buffetjs/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useIntl } from 'react-intl';

import useListView from '../../hooks/useListView';
import dateFormats from '../../utils/dateFormats';
import CustomInputCheckbox from '../CustomInputCheckbox';
import getTrad from '../../utils/getTrad';
import MediaPreviewList from '../MediaPreviewList';
import { ActionContainer, Truncate, Truncated } from './styledComponents';
import State from './State';

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */

const getDisplayedValue = (type, value, name) => {
  switch (toLower(type)) {
    case 'string':
    case 'text':
    case 'email':
    case 'enumeration':
    case 'uid':
      return (value && !isEmpty(toString(value))) || name === 'id' ? toString(value) : '-';
    case 'float':
    case 'integer':
    case 'biginteger':
    case 'decimal':
      return !isNull(value) ? toString(value) : '-';
    case 'boolean':
      return value !== null ? toString(value) : '-';
    case 'date':
    case 'datetime':
    case 'timestamp': {
      if (value == null) {
        return '-';
      }

      const date =
        value && isObject(value) && value._isAMomentObject === true ? JSON.stringify(value) : value;

      return moment(date).format(dateFormats[type]);
    }
    case 'password':
      return '••••••••';
    case 'media':
    case 'file':
    case 'files':
      return value;
    case 'time': {
      if (!value) {
        return '-';
      }

      const [hour, minute, second] = value.split(':');
      const timeObj = {
        hour,
        minute,
        second,
      };
      const date = moment().set(timeObj);

      return date.format(dateFormats.time);
    }
    default:
      return '-';
  }
};

function Row({ canDelete, canUpdate, isBulkable, row, headers }) {
  const { entriesToDelete, onChangeBulk, onClickDelete, schema } = useListView();
  const { formatMessage } = useIntl();

  const memoizedDisplayedValue = useCallback(
    name => {
      const type = get(schema, ['attributes', name, 'type'], 'string');

      return getDisplayedValue(type, row[name], name);
    },
    [row, schema]
  );

  const isMedia = useCallback(
    header => {
      return get(schema, ['attributes', header.name, 'type']) === 'media';
    },
    [schema]
  );

  const { emitEvent } = useGlobalContext();

  const links = [
    {
      icon: canUpdate ? <FontAwesomeIcon icon="pencil-alt" /> : null,
    },
    {
      icon: canDelete ? <FontAwesomeIcon icon="trash-alt" /> : null,
      onClick: e => {
        e.stopPropagation();
        emitEvent('willDeleteEntryFromList');
        onClickDelete(row.id);
      },
    },
  ];

  return (
    <>
      {isBulkable && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
        <td key="i" onClick={e => e.stopPropagation()}>
          <CustomInputCheckbox
            name={row.id}
            onChange={onChangeBulk}
            value={entriesToDelete.filter(id => toString(id) === toString(row.id)).length > 0}
          />
        </td>
      )}
      {headers.map(header => {
        return (
          <td key={header.name}>
            {isMedia(header) && <MediaPreviewList files={memoizedDisplayedValue(header.name)} />}
            {header.name === 'published_at' && (
              <State isGreen={row.published_at}>
                <Text>
                  {formatMessage({
                    id: getTrad(`containers.List.${row.published_at ? 'published' : 'draft'}`),
                  })}
                </Text>
              </State>
            )}
            {!isMedia(header) && header.name !== 'published_at' && (
              <Truncate>
                <Truncated>{memoizedDisplayedValue(header.name)}</Truncated>
              </Truncate>
            )}
          </td>
        );
      })}
      <ActionContainer>
        <IconLinks links={links} />
      </ActionContainer>
    </>
  );
}

Row.propTypes = {
  canDelete: PropTypes.bool.isRequired,
  canUpdate: PropTypes.bool.isRequired,
  headers: PropTypes.array.isRequired,
  isBulkable: PropTypes.bool.isRequired,
  row: PropTypes.object.isRequired,
};

export default memo(Row);
