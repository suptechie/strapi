import { useEffect } from 'react';

import { useNotification, useFetchClient, useAPIErrorHandler } from '@strapi/helper-plugin';
import { useQueries } from 'react-query';

import { cleanPermissions, getTrad } from '../utils';

export const usePlugins = () => {
  const toggleNotification = useNotification();
  const { get } = useFetchClient();
  const { formatAPIError } = useAPIErrorHandler(getTrad);

  const [
    {
      data: permissions,
      isLoading: isLoadingPermissions,
      error: permissionsError,
      refetch: refetchPermissions,
    },
    { data: routes, isLoading: isLoadingRoutes, error: routesError, refetch: refetchRoutes },
  ] = useQueries([
    {
      queryKey: ['users-permissions', 'permissions'],
      async queryFn() {
        const res = await get(`/users-permissions/permissions`);

        return res.data.permissions;
      },
    },
    {
      queryKey: ['users-permissions', 'routes'],
      async queryFn() {
        const res = await get(`/users-permissions/routes`);

        return res.data.routes;
      },
    },
  ]);

  const refetchQueries = async () => {
    await Promise.all([refetchPermissions(), refetchRoutes()]);
  };

  useEffect(() => {
    if (permissionsError) {
      toggleNotification({
        type: 'warning',
        message: formatAPIError(permissionsError),
      });
    }
  }, [toggleNotification, permissionsError, formatAPIError]);

  useEffect(() => {
    if (routesError) {
      toggleNotification({
        type: 'warning',
        message: formatAPIError(routesError),
      });
    }
  }, [toggleNotification, routesError, formatAPIError]);

  const isLoading = isLoadingPermissions || isLoadingRoutes;

  return {
    permissions: permissions ? cleanPermissions(permissions) : {},
    routes: routes ?? {},
    getData: refetchQueries,
    isLoading,
  };
};
