import * as React from 'react';

import { skipToken } from '@reduxjs/toolkit/query';
import { useAPIErrorHandler } from '@strapi/admin/strapi-admin';
import {
  Box,
  Button,
  FieldLabel,
  Flex,
  ModalBody,
  ModalHeader,
  ModalLayout,
  SingleSelect,
  SingleSelectOption,
  Typography,
  ModalFooter,
  EmptyStateLayout,
} from '@strapi/design-system';
import { LinkButton } from '@strapi/design-system/v2';
import { useNotification, useQueryParams, useRBAC } from '@strapi/helper-plugin';
import { EmptyDocuments, Plus } from '@strapi/icons';
import { Common } from '@strapi/types';
import { isAxiosError } from 'axios';
import { Formik, Form } from 'formik';
import { useIntl } from 'react-intl';
import { Link as ReactRouterLink, useParams } from 'react-router-dom';
import * as yup from 'yup';

import { CreateReleaseAction } from '../../../shared/contracts/release-actions';
import { GetContentTypeEntryReleases } from '../../../shared/contracts/releases';
import { PERMISSIONS } from '../constants';
import { useCreateReleaseActionMutation, useGetReleasesForEntryQuery } from '../services/release';
import { getTimezoneOffset } from '../utils/time';

import { ReleaseActionMenu } from './ReleaseActionMenu';
import { ReleaseActionOptions } from './ReleaseActionOptions';

/* -------------------------------------------------------------------------------------------------
 * AddActionToReleaseModal
 * -----------------------------------------------------------------------------------------------*/

const RELEASE_ACTION_FORM_SCHEMA = yup.object().shape({
  type: yup.string().oneOf(['publish', 'unpublish']).required(),
  releaseId: yup.string().required(),
});

interface FormValues {
  type: CreateReleaseAction.Request['body']['type'];
  releaseId: CreateReleaseAction.Request['params']['releaseId'];
}

const INITIAL_VALUES = {
  type: 'publish',
  releaseId: '',
} satisfies FormValues;

interface AddActionToReleaseModalProps {
  handleClose: () => void;
  contentTypeUid: GetContentTypeEntryReleases.Request['query']['contentTypeUid'];
  entryId: GetContentTypeEntryReleases.Request['query']['entryId'];
}

const NoReleases = () => {
  const { formatMessage } = useIntl();
  return (
    <EmptyStateLayout
      icon={<EmptyDocuments width="10rem" />}
      content={formatMessage({
        id: 'content-releases.content-manager-edit-view.add-to-release.no-releases-message',
        defaultMessage:
          'No available releases. Open the list of releases and create a new one from there.',
      })}
      action={
        <LinkButton
          // @ts-expect-error - types are not inferred correctly through the as prop.
          to={{
            pathname: '/plugins/content-releases',
          }}
          as={ReactRouterLink}
          variant="secondary"
        >
          {formatMessage({
            id: 'content-releases.content-manager-edit-view.add-to-release.redirect-button',
            defaultMessage: 'Open the list of releases',
          })}
        </LinkButton>
      }
    />
  );
};

const AddActionToReleaseModal = ({
  handleClose,
  contentTypeUid,
  entryId,
}: AddActionToReleaseModalProps) => {
  const releaseHeaderId = React.useId();
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const [{ query }] = useQueryParams<{ plugins?: { i18n?: { locale?: string } } }>();
  const locale = query.plugins?.i18n?.locale;

  // Get all 'pending' releases that do not have the entry attached
  const response = useGetReleasesForEntryQuery({
    contentTypeUid,
    entryId,
    hasEntryAttached: false,
  });

  const releases = response.data?.data;
  const [createReleaseAction, { isLoading }] = useCreateReleaseActionMutation();

  const handleSubmit = async (values: FormValues) => {
    const releaseActionEntry = {
      contentType: contentTypeUid,
      id: entryId,
      locale,
    };
    const response = await createReleaseAction({
      body: { type: values.type, entry: releaseActionEntry },
      params: { releaseId: values.releaseId },
    });

    if ('data' in response) {
      // Handle success
      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: 'content-releases.content-manager-edit-view.add-to-release.notification.success',
          defaultMessage: 'Entry added to release',
        }),
      });

      handleClose();
      return;
    }

    if ('error' in response) {
      if (isAxiosError(response.error)) {
        // Handle axios error
        toggleNotification({
          type: 'warning',
          message: formatAPIError(response.error),
        });
      } else {
        // Handle generic error
        toggleNotification({
          type: 'warning',
          message: formatMessage({ id: 'notification.error', defaultMessage: 'An error occurred' }),
        });
      }
    }
  };

  return (
    <ModalLayout onClose={handleClose} labelledBy={releaseHeaderId}>
      <ModalHeader>
        <Typography id={releaseHeaderId} fontWeight="bold" textColor="neutral800">
          {formatMessage({
            id: 'content-releases.content-manager-edit-view.add-to-release',
            defaultMessage: 'Add to release',
          })}
        </Typography>
      </ModalHeader>
      <Formik
        onSubmit={handleSubmit}
        validationSchema={RELEASE_ACTION_FORM_SCHEMA}
        initialValues={INITIAL_VALUES}
      >
        {({ values, setFieldValue }) => {
          return (
            <Form>
              {releases?.length === 0 ? (
                <NoReleases />
              ) : (
                <ModalBody>
                  <Flex direction="column" alignItems="stretch" gap={2}>
                    <Box paddingBottom={6}>
                      <SingleSelect
                        required
                        label={formatMessage({
                          id: 'content-releases.content-manager-edit-view.add-to-release.select-label',
                          defaultMessage: 'Select a release',
                        })}
                        placeholder={formatMessage({
                          id: 'content-releases.content-manager-edit-view.add-to-release.select-placeholder',
                          defaultMessage: 'Select',
                        })}
                        onChange={(value) => setFieldValue('releaseId', value)}
                        value={values.releaseId}
                      >
                        {releases?.map((release) => (
                          <SingleSelectOption key={release.id} value={release.id}>
                            {release.name}
                          </SingleSelectOption>
                        ))}
                      </SingleSelect>
                    </Box>
                    <FieldLabel>
                      {formatMessage({
                        id: 'content-releases.content-manager-edit-view.add-to-release.action-type-label',
                        defaultMessage: 'What do you want to do with this entry?',
                      })}
                    </FieldLabel>
                    <ReleaseActionOptions
                      selected={values.type}
                      handleChange={(e) => setFieldValue('type', e.target.value)}
                      name="type"
                    />
                  </Flex>
                </ModalBody>
              )}
              <ModalFooter
                startActions={
                  <Button onClick={handleClose} variant="tertiary" name="cancel">
                    {formatMessage({
                      id: 'content-releases.content-manager-edit-view.add-to-release.cancel-button',
                      defaultMessage: 'Cancel',
                    })}
                  </Button>
                }
                endActions={
                  /**
                   * TODO: Ideally we would use isValid from Formik to disable the button, however currently it always returns true
                   * for yup.string().required(), even when the value is falsy (including empty string)
                   */
                  <Button type="submit" disabled={!values.releaseId} loading={isLoading}>
                    {formatMessage({
                      id: 'content-releases.content-manager-edit-view.add-to-release.continue-button',
                      defaultMessage: 'Continue',
                    })}
                  </Button>
                }
              />
            </Form>
          );
        }}
      </Formik>
    </ModalLayout>
  );
};

/* -------------------------------------------------------------------------------------------------
 * CMReleasesContainer
 * -----------------------------------------------------------------------------------------------*/

export const CMReleasesContainer = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { formatMessage, formatDate, formatTime } = useIntl();
  const { id, slug } = useParams<{
    id: string;
    origin: string;
    slug: string;
    collectionType: string;
  }>();
  const isCreatingEntry = id === 'create';
  const {
    allowedActions: { canCreateAction, canMain, canDeleteAction },
  } = useRBAC(PERMISSIONS);

  const contentTypeUid = slug as Common.UID.ContentType;
  const canFetch = id != null && contentTypeUid != null;
  const fetchParams = canFetch
    ? {
        contentTypeUid: contentTypeUid,
        entryId: id,
        hasEntryAttached: true,
      }
    : skipToken;
  // Get all 'pending' releases that have the entry attached
  // @ts-expect-error – we'll fix this when we fix content-releases for v5
  const response = useGetReleasesForEntryQuery(fetchParams);
  const releases = response.data?.data;

  /**
   * If we don't have a contentTypeUid or entryId then the data was never fetched
   */
  if (!canFetch) {
    return null;
  }

  /**
   * - Impossible to add entry to release before it exists
   */
  if (isCreatingEntry) {
    return null;
  }

  const toggleModal = () => setIsModalOpen((prev) => !prev);

  const getReleaseColorVariant = (
    actionType: 'publish' | 'unpublish',
    shade: '100' | '200' | '600'
  ) => {
    if (actionType === 'unpublish') {
      return `secondary${shade}`;
    }

    return `success${shade}`;
  };

  if (!canMain) {
    return null;
  }

  return (
    <Box
      as="aside"
      aria-label={formatMessage({
        id: 'content-releases.plugin.name',
        defaultMessage: 'Releases',
      })}
      background="neutral0"
      borderColor="neutral150"
      hasRadius
      padding={4}
      shadow="tableShadow"
    >
      <Flex direction="column" alignItems="stretch" gap={3}>
        <Typography variant="sigma" textColor="neutral600" textTransform="uppercase">
          {formatMessage({
            id: 'content-releases.plugin.name',
            defaultMessage: 'Releases',
          })}
        </Typography>
        {releases?.map((release) => {
          return (
            <Flex
              key={release.id}
              direction="column"
              alignItems="start"
              borderWidth="1px"
              borderStyle="solid"
              borderColor={getReleaseColorVariant(release.action.type, '200')}
              overflow="hidden"
              hasRadius
            >
              <Box
                paddingTop={3}
                paddingBottom={3}
                paddingLeft={4}
                paddingRight={4}
                background={getReleaseColorVariant(release.action.type, '100')}
                width="100%"
              >
                <Typography
                  fontSize={1}
                  variant="pi"
                  textColor={getReleaseColorVariant(release.action.type, '600')}
                >
                  {formatMessage(
                    {
                      id: 'content-releases.content-manager-edit-view.list-releases.title',
                      defaultMessage:
                        '{isPublish, select, true {Will be published in} other {Will be unpublished in}}',
                    },
                    { isPublish: release.action.type === 'publish' }
                  )}
                </Typography>
              </Box>
              <Flex padding={4} direction="column" gap={2} width="100%" alignItems="flex-start">
                <Flex padding={4} direction="column" gap={2} width="100%" alignItems="flex-start">
                  <Typography fontSize={2} fontWeight="bold" variant="omega" textColor="neutral700">
                    {release.name}
                  </Typography>
                  {release.scheduledAt && release.timezone && (
                    <Typography variant="pi" textColor="neutral600">
                      {formatMessage(
                        {
                          id: 'content-releases.content-manager-edit-view.scheduled.date',
                          defaultMessage: '{date} at {time} ({offset})',
                        },
                        {
                          date: formatDate(new Date(release.scheduledAt), {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            timeZone: release.timezone,
                          }),
                          time: formatTime(new Date(release.scheduledAt), {
                            hourCycle: 'h23',
                            timeZone: release.timezone,
                          }),
                          offset: getTimezoneOffset(
                            release.timezone,
                            new Date(release.scheduledAt)
                          ),
                        }
                      )}
                    </Typography>
                  )}
                  {canDeleteAction ? (
                    <ReleaseActionMenu.Root hasTriggerBorder>
                      <ReleaseActionMenu.EditReleaseItem releaseId={release.id} />
                      <ReleaseActionMenu.DeleteReleaseActionItem
                        releaseId={release.id}
                        actionId={release.action.id}
                      />
                    </ReleaseActionMenu.Root>
                  ) : null}
                </Flex>
              </Flex>
            </Flex>
          );
        })}
        {canCreateAction ? (
          <Button
            justifyContent="center"
            paddingLeft={4}
            paddingRight={4}
            color="neutral700"
            variant="tertiary"
            startIcon={<Plus />}
            onClick={toggleModal}
          >
            {formatMessage({
              id: 'content-releases.content-manager-edit-view.add-to-release',
              defaultMessage: 'Add to release',
            })}
          </Button>
        ) : null}
      </Flex>
      {isModalOpen && (
        <AddActionToReleaseModal
          handleClose={toggleModal}
          contentTypeUid={contentTypeUid}
          // @ts-expect-error – we'll fix this when we fix content-releases for v5
          entryId={id}
        />
      )}
    </Box>
  );
};
