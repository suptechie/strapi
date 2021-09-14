import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNotifyAT } from '@strapi/parts/LiveRegions';
import { useNotification, useQueryParams } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';
import { axiosInstance, getRequestUrl } from '../utils';

export const useAssets = ({ skipWhen }) => {
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();
  const { notifyStatus } = useNotifyAT();
  const [{ rawQuery, query }, setQuery] = useQueryParams();
  const dataRequestURL = getRequestUrl('files');

  const { data, error, isLoading } = useQuery(
    'assets',
    async () => {
      const { data } = await axiosInstance.get(`${dataRequestURL}${rawQuery}`);

      return data;
    },
    { enabled: !skipWhen }
  );

  useEffect(() => {
    if (!query) {
      setQuery({ sort: 'updatedAt:DESC', page: 1, pageSize: 10 });
    }
  }, [query, setQuery]);

  useEffect(() => {
    if (data) {
      notifyStatus(
        formatMessage({
          id: 'list.asset.at.finished',
          defaultMessage: 'The assets have finished loading.',
        })
      );
    }
  }, [data, notifyStatus, formatMessage]);

  useEffect(() => {
    if (error) {
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error' },
      });
    }
  }, [error, toggleNotification]);

  return { data, error, isLoading };
};
