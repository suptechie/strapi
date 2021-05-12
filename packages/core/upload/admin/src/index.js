// NOTE TO PLUGINS DEVELOPERS:
// If you modify this file by adding new options to the plugin entry point
// Here's the file: strapi/docs/3.0.0-beta.x/plugin-development/frontend-field-api.md
// Here's the file: strapi/docs/3.0.0-beta.x/guides/registering-a-field-in-admin.md
// Also the strapi-generate-plugins/files/admin/src/index.js needs to be updated
// IF THE DOC IS NOT UPDATED THE PULL REQUEST WILL NOT BE MERGED
import React from 'react';
import { CheckPagePermissions } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginLogo from './assets/images/logo.svg';
import pluginPermissions from './permissions';
import App from './containers/App';
import Initializer from './containers/Initializer';
import SettingsPage from './containers/SettingsPage';
import InputMedia from './components/InputMedia';
import InputModalStepper from './containers/InputModalStepper';
import reducers from './reducers';
import trads from './translations';
import pluginId from './pluginId';
import { getTrad } from './utils';

const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;
const icon = pluginPkg.strapi.icon;
const name = pluginPkg.strapi.name;

export default {
  register(app) {
    // TODO update doc and guides
    app.addComponents({ name: 'media-library', Component: InputModalStepper });
    // TODO update guide
    app.addFields({ type: 'media', Component: InputMedia });

    app.addReducers(reducers);

    app.registerPlugin({
      description: pluginDescription,
      icon,
      id: pluginId,
      initializer: Initializer,

      isReady: false,
      isRequired: pluginPkg.strapi.required || false,

      mainComponent: App,
      name,
      pluginLogo,
      preventComponentRendering: false,
      settings: {
        global: {
          links: [
            {
              title: {
                id: getTrad('plugin.name'),
                defaultMessage: 'Media Library',
              },
              name: 'media-library',
              to: '/settings/media-library',
              Component: () => (
                <CheckPagePermissions permissions={pluginPermissions.settings}>
                  <SettingsPage />
                </CheckPagePermissions>
              ),
              permissions: pluginPermissions.settings,
            },
          ],
        },
      },
      trads,
      menu: {
        pluginsSectionLinks: [
          {
            destination: `/plugins/${pluginId}`,
            icon,
            label: {
              id: `${pluginId}.plugin.name`,
              defaultMessage: 'Media Library',
            },
            name,
            permissions: pluginPermissions.main,
          },
        ],
      },
    });
  },
  boot() {},
};
