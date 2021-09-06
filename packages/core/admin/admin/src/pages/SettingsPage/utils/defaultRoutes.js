import RolesCreatePage from 'ee_else_ce/pages/Roles/CreatePage';
import ProtectedRolesListPage from 'ee_else_ce/pages/Roles/ProtectedListPage';

const defaultRoutes = [
  {
    Component: () => {
      return { default: ProtectedRolesListPage };
    },

    to: '/settings/roles',
    exact: true,
  },
  {
    Component: () => {
      return { default: RolesCreatePage };
    },
    to: '/settings/roles/duplicate/:id',
    exact: true,
  },
  {
    Component: () => {
      return { default: RolesCreatePage };
    },
    to: '/settings/roles/new',
    exact: true,
  },
  {
    Component: async () => {
      const component = await import(
        /* webpackChunkName: "admin-edit-roles-page" */ '../../Roles/ProtectedEditPage'
      );

      return component;
    },
    to: '/settings/roles/:id',
    exact: true,
  },
  {
    Component: async () => {
      const component = await import(
        /* webpackChunkName: "admin-users" */ '../../Users/ProtectedListPage'
      );

      return component;
    },
    to: '/settings/users',
    exact: true,
  },
  {
    Component: async () => {
      const component = await import(
        /* webpackChunkName: "admin-edit-users" */ '../../Users/ProtectedEditPage'
      );

      return component;
    },
    to: '/settings/users/:id',
    exact: true,
  },
  {
    Component: async () => {
      const component = await import(
        /* webpackChunkName: "webhook-edit-page" */ '../pages/Webhooks/ProtectedCreateView'
      );

      return component;
    },
    to: '/settings/webhooks/create',
    exact: true,
  },
  {
    Component: async () => {
      const component = await import(
        /* webpackChunkName: "webhook-edit-page" */ '../pages/Webhooks/ProtectedEditView'
      );

      return component;
    },
    to: '/settings/webhooks/:id',
    exact: true,
  },
  {
    Component: async () => {
      const component = await import(
        /* webpackChunkName: "webhook-list-page" */ '../pages/Webhooks/ProtectedListView'
      );

      return component;
    },
    to: '/settings/webhooks',
    exact: true,
  },
];

export default defaultRoutes;
