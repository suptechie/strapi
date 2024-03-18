import { useNotification } from '@strapi/admin/strapi-admin';
import { useIntl } from 'react-intl';
import { useMutation, useQueryClient } from 'react-query';

import pluginId from '../pluginId';
import { deleteRequest } from '../utils/deleteRequest';

export const useRemoveAsset = (onSuccess) => {
  const { toggleNotification } = useNotification();
  const { formatMessage } = useIntl();
  const queryClient = useQueryClient();

  const mutation = useMutation((assetId) => deleteRequest('files', assetId), {
    onSuccess() {
      queryClient.refetchQueries([pluginId, 'assets'], { active: true });
      queryClient.refetchQueries([pluginId, 'asset-count'], { active: true });

      toggleNotification({
        type: 'success',
        message: formatMessage({
          id: 'modal.remove.success-label',
          defaultMessage: 'Elements have been successfully deleted.',
        }),
      });

      onSuccess();
    },
    onError(error) {
      toggleNotification({ type: 'danger', message: error.message });
    },
  });

  const removeAsset = async (assetId) => {
    await mutation.mutateAsync(assetId);
  };

  return { ...mutation, removeAsset };
};
