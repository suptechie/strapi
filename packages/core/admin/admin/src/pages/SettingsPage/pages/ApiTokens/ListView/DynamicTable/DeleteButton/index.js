import React from 'react';
import DeleteIcon from '@strapi/icons/DeleteIcon';
import { IconButton } from '@strapi/parts/IconButton';
import { Box } from '@strapi/parts/Box';
import { stopPropagation } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

const DeleteButton = ({ tokenName, onClick }) => {
  const { formatMessage } = useIntl();

  return (
    <Box paddingLeft={1} {...stopPropagation}>
      <IconButton
        onClick={onClick}
        label={formatMessage(
          {
            id: 'app.component.table.delete',
            defaultMessage: 'Delete {target}',
          },
          { target: `${tokenName}` }
        )}
        noBorder
        icon={<DeleteIcon />}
      />
    </Box>
  );
};

DeleteButton.propTypes = {
  tokenName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default DeleteButton;
