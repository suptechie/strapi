import type { Permission } from '@strapi/helper-plugin';

type SettingsPermissions = 'project-settings' | 'users' | 'webhooks' | 'sso' | 'roles';

interface CRUDPermissions {
  main: Permission[];
  read: Permission[];
  create: Permission[];
  update: Permission[];
  delete: Permission[];
  [key: string]: Permission[];
}

interface PermissionMap {
  marketplace: CRUDPermissions;
  settings: Record<SettingsPermissions, CRUDPermissions>;
}

export { PermissionMap };
