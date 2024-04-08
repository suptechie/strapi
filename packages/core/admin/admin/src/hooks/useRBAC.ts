import { useEffect, useMemo, useState } from 'react';

import isEqual from 'lodash/isEqual';

import { useAuth, Permission } from '../features/Auth';
import { once } from '../utils/once';
import { capitalise } from '../utils/strings';

import { usePrev } from './usePrev';

type AllowedActions = Record<string, boolean>;

/**
 * @public
 * @description This hooks takes an object or array of permissions (the latter preferred) and
 * runs through them to match against the current user's permissions as well as the RBAC middleware
 * system checking any conditions that may be present. It returns the filtered permissions as the complete
 * object from the API and a set of actions that can be performed. An action is derived from the last part
 * of the permission action e.g. `admin::roles.create` would be `canCreate`. If there's a hyphen in the action
 * this is removed and capitalised e.g `admin::roles.create-draft` would be `canCreateDraft`.
 * @example
 * ```tsx
 * import { Page, useRBAC } from '@strapi/strapi/admin'
 *
 * const MyProtectedPage = () => {
 *  const { allowedActions, isLoading, error, permissions } = useRBAC([{ action: 'admin::roles.create' }])
 *
 *  if(isLoading) {
 *    return <Page.Loading />
 *  }
 *
 *  if(error){
 *    return <Page.Error />
 *  }
 *
 *  if(!allowedActions.canCreate) {
 *    return null
 *  }
 *
 *  return <MyPage permissions={permissions} />
 * }
 * ```
 */
const useRBAC = (
  permissionsToCheck: Record<string, Permission[]> | Permission[] = [],
  passedPermissions?: Permission[]
): {
  allowedActions: AllowedActions;
  isLoading: boolean;
  error?: unknown;
  permissions: Permission[];
} => {
  const isLoadingAuth = useAuth('useRBAC', (state) => state.isLoading);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [data, setData] = useState<Record<string, boolean>>();

  const warnOnce = useMemo(() => once(console.warn), []);

  const actualPermissionsToCheck: Permission[] = useMemo(() => {
    if (Array.isArray(permissionsToCheck)) {
      return permissionsToCheck;
    } else {
      warnOnce(
        'useRBAC: The first argument should be an array of permissions, not an object. This will be deprecated in the future.'
      );

      return Object.values(permissionsToCheck).flat();
    }
  }, [permissionsToCheck, warnOnce]);

  /**
   * This is the default value we return until the queryResults[i].data
   * are all resolved with data. This preserves the original behaviour.
   */
  const defaultAllowedActions = useMemo(() => {
    return actualPermissionsToCheck.reduce<Record<string, boolean>>((acc, permission) => {
      return {
        ...acc,
        [getActionName(permission)]: false,
      };
    }, {});
  }, [actualPermissionsToCheck]);

  const checkUserHasPermissions = useAuth('useRBAC', (state) => state.checkUserHasPermissions);

  const permssionsChecked = usePrev(actualPermissionsToCheck);
  useEffect(() => {
    if (!isEqual(permssionsChecked, actualPermissionsToCheck)) {
      setIsLoading(true);
      setData(undefined);
      setError(undefined);

      checkUserHasPermissions(actualPermissionsToCheck, passedPermissions)
        .then((res) => {
          if (res) {
            setData(
              res.reduce<Record<string, boolean>>((acc, permission) => {
                return {
                  ...acc,
                  [getActionName(permission)]: true,
                };
              }, {})
            );
          }
        })
        .catch((err) => {
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [
    actualPermissionsToCheck,
    checkUserHasPermissions,
    passedPermissions,
    permissionsToCheck,
    permssionsChecked,
  ]);

  /**
   * This hook originally would not return allowedActions
   * until all the checks were complete.
   */
  const allowedActions = Object.entries({
    ...defaultAllowedActions,
    ...data,
  }).reduce((acc, [name, allowed]) => {
    acc[`can${capitalise(name)}`] = allowed;

    return acc;
  }, {} as AllowedActions);

  return {
    allowedActions,
    permissions: actualPermissionsToCheck,
    isLoading: isLoading || isLoadingAuth,
    error,
  };
};

const getActionName = (permission: Permission): string => {
  const [action = ''] = permission.action.split('.').slice(-1);
  return action.split('-').map(capitalise).join('');
};

export { useRBAC };
export type { AllowedActions };
