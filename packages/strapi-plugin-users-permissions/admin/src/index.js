// NOTE TO PLUGINS DEVELOPERS:
// If you modify this file by adding new options to the plugin entry point
// Here's the file: strapi/docs/3.0.0-beta.x/plugin-development/frontend-field-api.md
// Here's the file: strapi/docs/3.0.0-beta.x/guides/registering-a-field-in-admin.md
// Also the strapi-generate-plugins/files/admin/src/index.js needs to be updated
// IF THE DOC IS NOT UPDATED THE PULL REQUEST WILL NOT BE MERGED

import React from 'react';
import { CheckPagePermissions } from 'strapi-helper-plugin';
import pluginPkg from '../../package.json';
import pluginLogo from './assets/images/logo.svg';
import pluginPermissions from './permissions';
import layout from '../../config/layout';
import pluginId from './pluginId';
import Initializer from './containers/Initializer';
import RolesPage from './containers/Roles';
import ProvidersPage from './containers/Providers';
import EmailTemplatesPage from './containers/EmailTemplates';
import AdvancedSettingsPage from './containers/AdvancedSettings';
import lifecycles from './lifecycles';
import trads from './translations';
import getTrad from './utils/getTrad';

export default strapi => {
  const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;
  const icon = pluginPkg.strapi.icon;
  const name = pluginPkg.strapi.name;

  const plugin = {
    blockerComponent: null,
    blockerComponentProps: {},
    description: pluginDescription,
    icon,
    id: pluginId,
    initializer: Initializer,
    injectedComponents: [],
    isRequired: pluginPkg.strapi.required || false,
    layout,
    lifecycles,
    name,
    pluginLogo,
    preventComponentRendering: false,
    settings: {
      menuSection: {
        id: pluginId,
        title: getTrad('plugin.name'),
        links: [
          {
            title: {
              id: getTrad('HeaderNav.link.roles'),
              defaultMessage: 'Roles',
            },
            name: 'roles',
            to: `${strapi.settingsBaseURL}/${pluginId}/roles`,
            Component: () => <RolesPage />,
            permissions: pluginPermissions.accessRoles,
          },
          {
            title: {
              id: getTrad('HeaderNav.link.providers'),
              defaultMessage: 'Providers',
            },
            name: 'providers',
            to: `${strapi.settingsBaseURL}/${pluginId}/providers`,
            Component: () => (
              <CheckPagePermissions permissions={pluginPermissions.readProviders}>
                <ProvidersPage />
              </CheckPagePermissions>
            ),
            permissions: pluginPermissions.readProviders,
          },
          {
            title: {
              id: getTrad('HeaderNav.link.email-templates'),
              defaultMessage: 'Email templates',
            },
            name: 'email-templates',
            to: `${strapi.settingsBaseURL}/${pluginId}/email-templates`,
            Component: () => (
              <CheckPagePermissions permissions={pluginPermissions.readEmailTemplates}>
                <EmailTemplatesPage />
              </CheckPagePermissions>
            ),
            permissions: pluginPermissions.readEmailTemplates,
          },
          {
            title: {
              id: getTrad('HeaderNav.link.advanced-settings'),
              defaultMessage: 'Advanced Settings',
            },
            name: 'advanced-settings',
            to: `${strapi.settingsBaseURL}/${pluginId}/advanced-settings`,
            Component: () => (
              <CheckPagePermissions permissions={pluginPermissions.readAdvancedSettings}>
                <AdvancedSettingsPage />
              </CheckPagePermissions>
            ),
            permissions: pluginPermissions.readAdvancedSettings,
          },
        ],
      },
    },
    trads,
  };

  return strapi.registerPlugin(plugin);
};
