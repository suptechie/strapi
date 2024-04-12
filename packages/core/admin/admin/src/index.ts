/**
 * DO NOT REMOVE. This export is whats used to render the admin panel at all.
 * Without it === no admin panel.
 */
export * from './render';

/**
 * components
 */
export { BackButton, type BackButtonProps } from './features/BackButton';
export * from './components/ConfirmDialog';
export * from './components/Context';
export * from './components/DescriptionComponentRenderer';
export * from './components/Filters';
export * from './components/Form';
export * from './components/FormInputs/Renderer';
export * from './components/PageHelpers';
export * from './components/Pagination';
export * from './components/SearchInput';
export * from './components/Table';

export { useGuidedTour } from './components/GuidedTour/Provider';

/**
 * Features
 */
export { useTracking, type TrackingEvent } from './features/Tracking';
export { useStrapiApp, type StrapiAppContextValue } from './features/StrapiApp';
export {
  useNotification,
  type NotificationsContextValue,
  type NotificationConfig,
  NotificationsProvider,
} from './features/Notifications';
export { useAppInfo, type AppInfoContextValue } from './features/AppInfo';
export { type Permission, useAuth, type AuthContextValue } from './features/Auth';

/**
 * Hooks
 */
export { useInjectReducer } from './hooks/useInjectReducer';
export { useAPIErrorHandler, type ApiError } from './hooks/useAPIErrorHandler';
export { useQueryParams } from './hooks/useQueryParams';
export { useFetchClient } from './hooks/useFetchClient';
export { useFocusInputField } from './hooks/useFocusInputField';
export { useRBAC } from './hooks/useRBAC';
export { useAdminUsers } from './services/users';

/**
 * Types
 */
export type { StrapiApp, MenuItem, InjectionZoneComponent } from './StrapiApp';
export type { Store } from './core/store/configure';
export type { Plugin, PluginConfig } from './core/apis/Plugin';
export type {
  SanitizedAdminUser,
  AdminUser,
  SanitizedAdminRole,
  AdminRole,
  Entity,
} from '../../shared/contracts/shared';
export type { RBACContext, RBACMiddleware } from './core/apis/rbac';

/**
 * Utils
 */
export { translatedErrors } from './utils/translatedErrors';
export { getFetchClient } from './utils/getFetchClient';
