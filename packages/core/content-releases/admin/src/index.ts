import { PaperPlane } from '@strapi/icons';

import { CMReleasesContainer } from './components/CMReleasesContainer';
import { PERMISSIONS } from './constants';
import { pluginId } from './pluginId';
import { prefixPluginTranslations } from './utils/prefixPluginTranslations';

import type { StrapiApp } from '@strapi/admin/strapi-admin';
import type { Plugin } from '@strapi/types';

// eslint-disable-next-line import/no-default-export
const admin: Plugin.Config.AdminInput = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(app: StrapiApp) {
    /**
     * Hook that adds the locale column in the Release Details table
     * @constant
     * @type {string}
     */
    app.createHook('ContentReleases/pages/ReleaseDetails/add-locale-in-releases');
    if (window.strapi.features.isEnabled('cms-content-releases')) {
      app.addMenuLink({
        to: `plugins/${pluginId}`,
        icon: PaperPlane,
        intlLabel: {
          id: `${pluginId}.plugin.name`,
          defaultMessage: 'Releases',
        },
        Component: () => import('./pages/App').then((mod) => ({ default: mod.App })),
        permissions: PERMISSIONS.main,
        position: 2,
      });

      // Insert the Releases container in the 'right-links' zone of the Content Manager's edit view
      app.getPlugin('content-manager').injectComponent('editView', 'right-links', {
        name: `${pluginId}-link`,
        Component: CMReleasesContainer,
      });

      // app.plugins['content-manager'].apis.addBulkAction((actions: BulkActionComponent[]) => {
      //   // We want to add this action to just before the delete action all the time
      //   const deleteActionIndex = actions.findIndex((action) => action.type === 'delete');

      //   actions.splice(deleteActionIndex, 0, ReleaseAction);
      //   return actions;
      // });
      // Hook that adds a column into the CM's LV table
      // app.registerHook('Admin/CM/pages/ListView/inject-column-in-table', addColumnToTableHook);
    } else if (
      !window.strapi.features.isEnabled('cms-content-releases') &&
      window.strapi?.flags?.promoteEE
    ) {
      app.addMenuLink({
        to: `/plugins/purchase-content-releases`,
        icon: PaperPlane,
        intlLabel: {
          id: `${pluginId}.plugin.name`,
          defaultMessage: 'Releases',
        },
        permissions: [],
        async Component() {
          const { PurchaseContentReleases } = await import('./pages/PurchaseContentReleases');
          return { default: PurchaseContentReleases };
        },
        lockIcon: true,
        position: 2,
      });
    }
  },
  async registerTrads({ locales }: { locales: string[] }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, 'content-releases'),
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

// eslint-disable-next-line import/no-default-export
export default admin;
