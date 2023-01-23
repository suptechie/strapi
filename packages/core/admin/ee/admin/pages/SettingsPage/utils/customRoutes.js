const routes = [];

if (window.strapi.features.isEnabled(strapi.features.SSO)) {
  routes.push({
    async Component() {
      const component = await import(
        /* webpackChunkName: "sso-settings-page" */ '../pages/SingleSignOn'
      );

      return component;
    },
    to: '/settings/single-sign-on',
    exact: true,
  });
}

if (window.strapi.isEE) {
  routes.push({
    async Component() {
      const component = await import(
        /* webpackChunkName: "review-workflows-settings" */ '../pages/ReviewWorkflows'
      );

      return component;
    },
    to: '/settings/review-workflows',
    exact: true,
  });
}

export default routes;
