import { useEffect } from 'react';

import { useAPIErrorHandler, useNotification, useFetchClient } from '@strapi/strapi/admin';
import { useIntl } from 'react-intl';
import { useMutation, useQuery } from 'react-query';

import pluginId from '../pluginId';
import getTrad from '../utils/getTrad';

export const useDocumentation = () => {
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();
  const { del, post, put, get } = useFetchClient();

  const { formatAPIError } = useAPIErrorHandler();

  const { isLoading, isError, data, refetch, error } = useQuery(
    ['get-documentation', pluginId],
    async () => {
      const { data } = await get(`/${pluginId}/getInfos`);

      return data;
    }
  );

  useEffect(() => {
    if (isError && error) {
      toggleNotification({
        type: 'danger',
        message: error
          ? formatAPIError(error)
          : formatMessage({ id: 'notification.error', defaultMessage: 'An error occurred' }),
      });
    }
  }, [isError, error, toggleNotification, formatAPIError, formatMessage]);

  const handleError = (err) => {
    toggleNotification({
      type: 'danger',
      message: formatAPIError(err),
    });
  };

  const handleSuccess = (type, tradId, defaultMessage) => {
    refetch();
    toggleNotification({
      type,
      message: formatMessage({ id: getTrad(tradId), defaultMessage }),
    });
  };

  const deleteMutation = useMutation(
    ({ prefix, version }) => del(`${prefix}/deleteDoc/${version}`),
    {
      onSuccess: () =>
        handleSuccess('info', 'notification.delete.success', 'Successfully deleted documentation'),
      onError: handleError,
    }
  );

  const submit = useMutation(({ prefix, body }) => put(`${prefix}/updateSettings`, body), {
    onSuccess: () =>
      handleSuccess('success', 'notification.update.success', 'Successfully updated settings'),
    onError: handleError,
  });

  const regenerate = useMutation(
    ({ prefix, version }) => post(`${prefix}/regenerateDoc`, { version }),
    {
      onSuccess: () =>
        handleSuccess(
          'info',
          'notification.generate.success',
          'Successfully generated documentation'
        ),
      onError: handleError,
    }
  );

  return { data, isLoading, isError, remove: deleteMutation, submit, regenerate };
};
