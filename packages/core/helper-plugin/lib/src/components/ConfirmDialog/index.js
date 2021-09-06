import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Dialog, DialogBody, DialogFooter } from '@strapi/parts/Dialog';
import { Stack } from '@strapi/parts/Stack';
import { Row } from '@strapi/parts/Row';
import { Text } from '@strapi/parts/Text';
import { Button } from '@strapi/parts/Button';
import AlertWarningIcon from '@strapi/icons/AlertWarningIcon';
import DeleteIcon from '@strapi/icons/DeleteIcon';

const ConfirmDialog = ({
  bodyText,
  iconRightButton,
  iconBody,
  isConfirmButtonLoading,
  leftButtonText,
  onToggleDialog,
  onConfirm,
  rightButtonText,
  title,
  variantRightButton,
  ...props
}) => {
  const { formatMessage } = useIntl();

  return (
    <Dialog
      onClose={onToggleDialog}
      title={formatMessage({
        id: title.id,
        defaultMessage: title.defaultMessage,
      })}
      labelledBy="confirmation"
      describedBy="confirm-description"
      {...props}
    >
      <DialogBody icon={iconBody}>
        <Stack size={2}>
          <Row justifyContent="center">
            <Text id="confirm-description">
              {formatMessage({
                id: bodyText.id,
                defaultMessage: bodyText.defaultMessage,
              })}
            </Text>
          </Row>
        </Stack>
      </DialogBody>
      <DialogFooter
        startAction={
          <Button onClick={onToggleDialog} variant="tertiary">
            {formatMessage({
              id: leftButtonText.id,
              defaultMessage: leftButtonText.defaultMessage,
            })}
          </Button>
        }
        endAction={
          <Button
            onClick={onConfirm}
            variant={variantRightButton}
            startIcon={iconRightButton}
            id="confirm-delete"
            loading={isConfirmButtonLoading}
          >
            {formatMessage({
              id: rightButtonText.id,
              defaultMessage: rightButtonText.defaultMessage,
            })}
          </Button>
        }
      />
    </Dialog>
  );
};

ConfirmDialog.defaultProps = {
  bodyText: {
    id: 'components.popUpWarning.message',
    defaultMessage: 'Are you sure you want to delete this?',
  },
  iconBody: <AlertWarningIcon />,
  iconRightButton: <DeleteIcon />,
  isConfirmButtonLoading: false,
  leftButtonText: {
    id: 'app.components.Button.cancel',
    defaultMessage: 'Cancel',
  },
  rightButtonText: {
    id: 'app.components.Button.confirm',
    defaultMessage: 'Confirm',
  },
  title: {
    id: 'app.components.ConfirmDialog.title',
    defaultMessage: 'Confirmation',
  },
  variantRightButton: 'danger-light',
};

ConfirmDialog.propTypes = {
  bodyText: PropTypes.shape({
    id: PropTypes.string,
    defaultMessage: PropTypes.string,
  }),
  iconBody: PropTypes.node,
  iconRightButton: PropTypes.node,
  isConfirmButtonLoading: PropTypes.bool,
  isVisible: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onToggleDialog: PropTypes.func.isRequired,
  leftButtonText: PropTypes.shape({
    id: PropTypes.string,
    defaultMessage: PropTypes.string,
  }),
  rightButtonText: PropTypes.shape({
    id: PropTypes.string,
    defaultMessage: PropTypes.string,
  }),
  title: PropTypes.shape({
    id: PropTypes.string,
    defaultMessage: PropTypes.string,
  }),
  variantRightButton: PropTypes.string,
};

export default ConfirmDialog;
