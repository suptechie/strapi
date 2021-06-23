// NOTE TO PLUGINS DEVELOPERS:
// If you modify this file by adding new options to the plugin entry point
// Here's the file: strapi/docs/3.0.0-beta.x/plugin-development/frontend-field-api.md
// Here's the file: strapi/docs/3.0.0-beta.x/guides/registering-a-field-in-admin.md
// Also the strapi-generate-plugins/files/admin/src/index.js needs to be updated
// IF THE DOC IS NOT UPDATED THE PULL REQUEST WILL NOT BE MERGED
import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import {
  INJECT_COLUMN_IN_TABLE,
  MUTATE_COLLECTION_TYPES_LINKS,
  MUTATE_EDIT_VIEW_LAYOUT,
  MUTATE_SINGLE_TYPES_LINKS,
} from './exposedHooks';
import pluginId from './pluginId';
import pluginLogo from './assets/images/logo.svg';
import reducers from './reducers';
import pluginPermissions from './permissions';

const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;
const icon = pluginPkg.strapi.icon;
const name = pluginPkg.strapi.name;

export default {
  register(app) {
    app.addCorePluginMenuLink({
      to: `/plugins/${pluginId}`,
      icon: 'book-open',
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Content manager',
      },
      permissions: pluginPermissions.main,
    });

    app.addReducers(reducers);

    // Hook that allows to mutate the displayed headers of the list view table
    app.createHook(INJECT_COLUMN_IN_TABLE);
    // Hook that allows to mutate the CM's link pre-set filters
    app.createHook(MUTATE_COLLECTION_TYPES_LINKS);
    app.createHook(MUTATE_SINGLE_TYPES_LINKS);
    // Hook that allows to mutate the CM's edit view layout
    app.createHook(MUTATE_EDIT_VIEW_LAYOUT);

    app.registerPlugin({
      description: pluginDescription,
      icon,
      id: pluginId,
      injectionZones: {
        editView: { informations: [], 'right-links': [] },
        listView: { actions: [], deleteModalAdditionalInfos: [] },
      },
      isReady: true,
      isRequired: pluginPkg.strapi.required || false,
      name,
      pluginLogo,
    });
  },
  boot() {},
  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map(locale => {
        return import(
          /* webpackChunkName: "content-manager-translation-[request]" */ `./translations/${locale}.json`
        )
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
