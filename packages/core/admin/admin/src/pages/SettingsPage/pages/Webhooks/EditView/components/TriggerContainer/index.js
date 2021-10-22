import React from 'react';
import PropTypes from 'prop-types';
import CheckIcon from '@strapi/icons/CheckIcon';
import ClearField from '@strapi/icons/ClearField';
import Close from '@strapi/icons/Close';
import LoadingIcon from '@strapi/icons/LoadingIcon';
import { Box } from '@strapi/parts/Box';
import { Flex } from '@strapi/parts/Flex';
import { Text } from '@strapi/parts/Text';
import { Stack } from '@strapi/parts/Stack';
import { Grid, GridItem } from '@strapi/parts/Grid';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

// Being discussed in Notion: create a <Icon /> component in Parts
const Icon = styled.svg(
  ({ theme, color }) => `
  width: ${12 / 16}rem;
  height: ${12 / 16}rem;

  path {
    fill: ${theme.colors[color]};
  }
`
);

const Status = ({ isPending, statusCode }) => {
  const { formatMessage } = useIntl();

  if (isPending) {
    return (
      <Stack horizontal size={2} style={{ alignItems: 'center' }}>
        <Icon as={LoadingIcon} />
        <Text>
          {formatMessage({ id: 'Settings.webhooks.trigger.pending', defaultMessage: 'pending' })}
        </Text>
      </Stack>
    );
  }

  if (statusCode >= 200 && statusCode < 300) {
    return (
      <Stack horizontal size={2} style={{ alignItems: 'center' }}>
        <Icon as={CheckIcon} color="success700" />
        <Text>
          {formatMessage({ id: 'Settings.webhooks.trigger.success', defaultMessage: 'success' })}
        </Text>
      </Stack>
    );
  }

  if (statusCode >= 300) {
    return (
      <Stack horizontal size={2} style={{ alignItems: 'center' }}>
        <Icon as={Close} color="danger700" />
        <Text>
          {formatMessage({ id: 'Settings.error', defaultMessage: 'error' })} {statusCode}
        </Text>
      </Stack>
    );
  }

  return null;
};
Status.propTypes = {
  isPending: PropTypes.bool.isRequired,
  statusCode: PropTypes.number,
};
Status.defaultProps = {
  statusCode: undefined,
};

const Message = ({ statusCode, message }) => {
  const { formatMessage } = useIntl();

  if (statusCode >= 200 && statusCode < 300) {
    return (
      <Flex justifyContent="flex-end">
        <Text>
          {formatMessage({
            id: 'Settings.webhooks.trigger.success.label',
            defaultMessage: 'success',
          })}
        </Text>
      </Flex>
    );
  }

  if (statusCode >= 300) {
    return (
      <Flex justifyContent="flex-end" title={message}>
        <Text
          // ! REMOVE THIS WHEN DS IS UPDATED WITH ELLIPSIS PROP
          style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {message}
        </Text>
      </Flex>
    );
  }

  return null;
};
Message.propTypes = {
  statusCode: PropTypes.number,
  message: PropTypes.string,
};
Message.defaultProps = {
  statusCode: undefined,
  message: undefined,
};

const CancelButton = ({ onCancel }) => {
  const { formatMessage } = useIntl();

  return (
    <Flex justifyContent="flex-end">
      <button onClick={onCancel} type="button">
        <Stack horizontal size={2} style={{ alignItems: 'center' }}>
          <Text textColor="neutral400">
            {formatMessage({ id: 'Settings.webhooks.trigger.cancel', defaultMessage: 'cancel' })}
          </Text>
          <Icon as={ClearField} color="neutral400" />
        </Stack>
      </button>
    </Flex>
  );
};

CancelButton.propTypes = { onCancel: PropTypes.func.isRequired };

const TriggerContainer = ({ isPending, onCancel, response }) => {
  const { statusCode, message } = response;
  const { formatMessage } = useIntl();

  return (
    <Box background="neutral0" padding={5} shadow="filterShadow" hasRadius>
      <Grid gap={4} style={{ alignItems: 'center' }}>
        <GridItem col={3}>
          <Text>
            {formatMessage({
              id: 'Settings.webhooks.trigger.test',
              defaultMessage: 'test-trigger',
            })}
          </Text>
        </GridItem>
        <GridItem col={3}>
          <Status isPending={isPending} statusCode={statusCode} />
        </GridItem>
        <GridItem col={6}>
          {!isPending ? (
            <Message statusCode={statusCode} message={message} />
          ) : (
            <CancelButton onCancel={onCancel} />
          )}
        </GridItem>
      </Grid>
    </Box>
  );
};

TriggerContainer.defaultProps = {
  isPending: false,
  onCancel: () => {},
  response: {},
};

TriggerContainer.propTypes = {
  isPending: PropTypes.bool,
  onCancel: PropTypes.func,
  response: PropTypes.object,
};

export default TriggerContainer;
