import { getFetchClient } from '@strapi/helper-plugin';
import { createRoot } from 'react-dom/client';

// eslint-disable-next-line import/extensions
import plugins from './plugins';
import { StrapiApp } from './StrapiApp';

const config = {
  locales: ['fr'],
};

const bootstrap = () => {};

window.strapi = {
  /**
   * This ENV variable is passed from the strapi instance, by default no url is set
   * in the config and therefore the instance returns you an empty string so URLs are relative.
   *
   * To ensure that the backendURL is always set, we use the window.location.origin as a fallback.
   */
  backendURL: process.env.STRAPI_ADMIN_BACKEND_URL || window.location.origin,
  isEE: false,
  telemetryDisabled: process.env.STRAPI_TELEMETRY_DISABLED ?? false,
  features: {
    SSO: 'sso',
    AUDIT_LOGS: 'audit-logs',
    REVIEW_WORKFLOWS: 'review-workflows',
  },
  projectType: 'Community',
  flags: {
    nps: false,
    promoteEE: true,
  },
};

const customConfig = { config, bootstrap };

const MOUNT_NODE = document.getElementById('app');

const run = async () => {
  const { get } = getFetchClient();
  try {
    const {
      data: {
        data: { isEE, features, flags },
      },
    } = await get('/admin/project-type');

    window.strapi.isEE = isEE;
    window.strapi.flags = flags;
    window.strapi.features = {
      ...window.strapi.features,
      isEnabled: (featureName) => features.some((feature) => feature.name === featureName),
    };
    window.strapi.projectType = isEE ? 'Enterprise' : 'Community';
  } catch (err) {
    console.error(err);
  }

  const app = new StrapiApp({
    appPlugins: plugins,
    adminConfig: customConfig,
    bootstrap: customConfig,
  });

  await app.bootstrapAdmin();
  await app.initialize();
  await app.bootstrap();

  await app.loadTrads();

  const root = createRoot(MOUNT_NODE);
  root.render(app.render());
};

run();
