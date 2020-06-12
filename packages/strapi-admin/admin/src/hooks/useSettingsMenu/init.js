import { retrieveGlobalLinks, retrievePluginsMenu, sortLinks } from '../../utils';
import { SETTINGS_BASE_URL } from '../../config';
import formatLinks from './utils/formatLinks';

const init = (initialState, plugins) => {
  // Retrieve the links that will be injected into the global section
  const pluginsGlobalLinks = retrieveGlobalLinks(plugins);
  // Sort the links by name
  const sortedGlobalLinks = sortLinks([
    {
      title: { id: 'Settings.webhooks.title' },
      to: `${SETTINGS_BASE_URL}/webhooks`,
      name: 'webhooks',
      isDisplayed: false,
      permissions: [
        { action: 'admin::webhooks.create', subject: null },
        { action: 'admin::webhooks.read', subject: null },
        { action: 'admin::webhooks.update', subject: null },
        { action: 'admin::webhooks.delete', subject: null },
      ],
    },
    ...pluginsGlobalLinks,
  ]);
  // Create the plugins settings sections
  // Note it is currently not possible to add a link into a plugin section
  const pluginsMenuSections = retrievePluginsMenu(plugins);

  const menu = [
    {
      id: 'global',
      title: { id: 'Settings.global' },
      links: sortedGlobalLinks,
    },
    {
      id: 'permissions',
      title: 'Settings.permissions',
      links: [
        {
          title: { id: 'Settings.permissions.menu.link.roles.label' },
          to: `${SETTINGS_BASE_URL}/roles`,
          name: 'roles',
          isDisplayed: false,
          permissions: [
            { action: 'admin::roles.create', subject: null },
            { action: 'admin::roles.update', subject: null },
            { action: 'admin::roles.read', subject: null },
            { action: 'admin::roles.delete', subject: null },
          ],
        },
        {
          title: { id: 'Settings.permissions.menu.link.users.label' },
          // Init the search params directly
          to: `${SETTINGS_BASE_URL}/users?pageSize=10&page=1&_sort=firstname%3AASC`,
          name: 'users',
          isDisplayed: false,
          permissions: [
            { action: 'admin::users.create', subject: null },
            { action: 'admin::users.read', subject: null },
            { action: 'admin::users.update', subject: null },
            { action: 'admin::users.delete', subject: null },
          ],
        },
      ],
    },
    ...pluginsMenuSections,
  ];

  return { ...initialState, menu: formatLinks(menu) };
};

export default init;
