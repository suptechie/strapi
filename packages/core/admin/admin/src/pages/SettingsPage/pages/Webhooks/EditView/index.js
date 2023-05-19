import * as React from 'react';
import {
  LoadingIndicatorPage,
  SettingsPageTitle,
  useNotification,
  useFetchClient,
  useAPIErrorHandler,
} from '@strapi/helper-plugin';
import { Main } from '@strapi/design-system';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useHistory, useRouteMatch } from 'react-router-dom';

import { useModels } from '../../../../../hooks';
import WebhookForm from './components/WebhookForm';

const cleanData = (data) => ({
  ...data,
  headers: data.headers.reduce((acc, current) => {
    const { key, value } = current;

    if (key !== '') {
      return {
        ...acc,
        [key]: value,
      };
    }

    return acc;
  }, {}),
});

const EditView = () => {
  const {
    params: { id },
  } = useRouteMatch('/settings/webhooks/:id');
  const isCreating = id === 'create';

  const { replace } = useHistory();
  const toggleNotification = useNotification();
  const { formatAPIError } = useAPIErrorHandler();
  const queryClient = useQueryClient();
  const { isLoading: isLoadingForModels } = useModels();
  const { put, get, post } = useFetchClient();

  const {
    isLoading,
    data: webhookData,
    error: webhookError,
  } = useQuery(
    ['get-webhook', id],
    async () => {
      const {
        data: { data },
      } = await get(`/admin/webhooks/${id}`);

      return data;
    },
    {
      enabled: !isCreating,
    }
  );

  React.useEffect(() => {
    if (webhookError) {
      toggleNotification({
        type: 'warning',
        message: formatAPIError(webhookError),
      });
    }
  }, [webhookError, toggleNotification, formatAPIError]);

  const {
    isLoading: isTriggering,
    data: triggerResponse,
    isIdle: isTriggerIdle,
    mutate,
  } = useMutation(() => post(`/admin/webhooks/${id}/trigger`));

  const triggerWebhook = () =>
    mutate(null, {
      onError(error) {
        toggleNotification({
          type: 'warning',
          message: formatAPIError(error),
        });
      },
    });

  const createWebhookMutation = useMutation((body) => post('/admin/webhooks', body));

  const updateWebhookMutation = useMutation(({ id, body }) => put(`/admin/webhooks/${id}`, body));

  const handleSubmit = async (data) => {
    if (isCreating) {
      createWebhookMutation.mutate(cleanData(data), {
        onSuccess({ data: result }) {
          toggleNotification({
            type: 'success',
            message: { id: 'Settings.webhooks.created' },
          });
          replace(`/settings/webhooks/${result.data.id}`);
        },
        onError(error) {
          toggleNotification({
            type: 'warning',
            message: formatAPIError(error),
          });
        },
      });

      return;
    }
    updateWebhookMutation.mutate(
      { id, body: cleanData(data) },
      {
        onSuccess() {
          queryClient.invalidateQueries(['get-webhook', id]);
          toggleNotification({
            type: 'success',
            message: { id: 'notification.form.success.fields' },
          });
        },
        onError(error) {
          toggleNotification({
            type: 'warning',
            message: formatAPIError(error),
          });
        },
      }
    );
  };

  if (isLoading || isLoadingForModels) {
    return <LoadingIndicatorPage />;
  }

  return (
    <Main>
      <SettingsPageTitle name="Webhooks" />
      <WebhookForm
        {...{
          data: webhookData,
          handleSubmit,
          triggerWebhook,
          isCreating,
          isTriggering,
          isTriggerIdle,
          triggerResponse: triggerResponse?.data.data,
        }}
      />
    </Main>
  );
};

export default EditView;
