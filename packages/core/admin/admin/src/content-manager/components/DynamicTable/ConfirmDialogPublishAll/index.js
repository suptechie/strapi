import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Flex, Typography, Button } from '@strapi/design-system';
import { ExclamationMarkCircle, Check } from '@strapi/icons';
import InjectionZoneList from '../../InjectionZoneList';
import { getTrad } from '../../../utils';
import ConfirmBulkActionDialog from '../ConfirmBulkActionDialog';

const ConfirmDialogPublishAll = ({ isOpen, onToggleDialog, isConfirmButtonLoading, onConfirm }) => {
  const { formatMessage } = useIntl();

  return (
    <ConfirmBulkActionDialog
      isOpen={isOpen}
      onToggleDialog={onToggleDialog}
      icon={<ExclamationMarkCircle />}
      dialogBody={
        <Flex direction="column" alignItems="stretch" gap={2}>
          <Typography id="confirm-description" textAlign="center">
            {formatMessage({
              id: getTrad('popUpWarning.bodyMessage.contentType.publish.all'),
              defaultMessage: 'Are you sure you want to publish these entries?',
            })}
          </Typography>
          <InjectionZoneList area="contentManager.listView.publishModalAdditionalInfos" />
        </Flex>
      }
      endAction={
        <Button
          onClick={onConfirm}
          variant="secondary"
          startIcon={<Check />}
          loading={isConfirmButtonLoading}
        >
          {formatMessage({
            id: 'app.utils.publish',
            defaultMessage: 'Publish',
          })}
        </Button>
      }
    />
  );
};

ConfirmDialogPublishAll.propTypes = {
  isConfirmButtonLoading: PropTypes.bool.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onToggleDialog: PropTypes.func.isRequired,
};

export default ConfirmDialogPublishAll;
