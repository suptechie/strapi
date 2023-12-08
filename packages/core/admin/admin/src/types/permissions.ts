import type { Permission } from '@strapi/helper-plugin';

type SettingsPermissions =
  | 'api-tokens'
  | 'project-settings'
  | 'roles'
  | 'transfer-tokens'
  | 'users'
  | 'webhooks'
  | 'review-workflows'
  | 'auditLogs';

type EESettingsPermissions = 'auditLogs' | 'review-workflows' | 'sso';

type CRUDPermissions = {
  main?: Permission[];
  read: Permission[];
  create?: Permission[];
  update: Permission[];
  delete?: Permission[];
} & { [key: string]: Permission[] };

interface PermissionMap {
  contentManager: {
    main: Permission[];
    collectionTypesConfigurations: Permission[];
    singleTypesConfigurations: Permission[];
    componentsConfigurations: Permission[];
  };
  marketplace: Pick<CRUDPermissions, 'main' | 'read'>;
  settings: Record<SettingsPermissions, CRUDPermissions> &
    Partial<Record<EESettingsPermissions, CRUDPermissions>>;
}

export { PermissionMap };
