import React from 'react';

import { Flex, Typography } from '@strapi/design-system';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { AssetDefinition, FolderDefinition } from '../../../../constants';
import { getTrad } from '../../../../utils';

import { BulkDeleteButton } from './BulkDeleteButton';
import { BulkMoveButton } from './BulkMoveButton';

export const BulkActions = ({ selected, onSuccess, currentFolder }) => {
  const { formatMessage } = useIntl();
  const numberAssets = selected.reduce(function (_this, val) {
    return val?.type === 'folder' ? _this + val.files.count : _this + 1;
  }, 0);

  return (
    <Flex gap={2} paddingBottom={5}>
      <Typography variant="epsilon" textColor="neutral600">
        {formatMessage(
          {
            id: getTrad('list.assets.selected'),
            defaultMessage:
              '{numberFolders, plural, one {1 folder} other {# folders}} - {numberAssets, plural, one {1 asset} other {# assets}} selected',
          },
          {
            numberFolders: selected.filter(({ type }) => type === 'folder').length,
            numberAssets,
          }
        )}
      </Typography>

      <BulkDeleteButton selected={selected} onSuccess={onSuccess} />
      <BulkMoveButton currentFolder={currentFolder} selected={selected} onSuccess={onSuccess} />
    </Flex>
  );
};

BulkActions.defaultProps = {
  currentFolder: undefined,
  selected: [],
};

BulkActions.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  currentFolder: FolderDefinition,
  selected: PropTypes.arrayOf(AssetDefinition, FolderDefinition),
};
