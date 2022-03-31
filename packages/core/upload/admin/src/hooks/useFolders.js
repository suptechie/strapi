import { useQuery } from 'react-query';
import { useNotifyAT } from '@strapi/design-system/LiveRegions';
import { useNotification, useQueryParams } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';

import pluginId from '../pluginId';
import { axiosInstance, getRequestUrl } from '../utils';

export const useFolders = ({ enabled = true }) => {
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();
  const { notifyStatus } = useNotifyAT();
  const [{ rawQuery }] = useQueryParams();
  const dataRequestURL = getRequestUrl('folders');

  const fetchFolders = async () => {
    console.log('wat');

    try {
      const { data } = await axiosInstance.get(`${dataRequestURL}${rawQuery}`);

      notifyStatus(
        formatMessage({
          id: 'list.asset.at.finished',
          defaultMessage: 'The folders have finished loading.',
        })
      );

      return data;
    } catch (err) {
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });

      throw err;
    }
  };

  const { data, error, isLoading } = useQuery([pluginId, `folders`, rawQuery], fetchFolders, {
    enabled,
    staleTime: 0,
    cacheTime: 0,
  });

  return { data, error, isLoading };
};
