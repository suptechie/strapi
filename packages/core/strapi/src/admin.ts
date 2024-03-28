import { RenderAdminArgs, renderAdmin } from '@strapi/admin/strapi-admin';
import contentTypeBuilder from '@strapi/plugin-content-type-builder/strapi-admin';
import contentManager from '@strapi/plugin-content-manager/strapi-admin';
import email from '@strapi/plugin-email/strapi-admin';
// @ts-expect-error – No types, yet.
import upload from '@strapi/plugin-upload/strapi-admin';
import i18n from '@strapi/plugin-i18n/strapi-admin';
import contentReleases from '@strapi/content-releases/strapi-admin';
// import reviewWorkflows from '@strapi/review-workflows/strapi-admin'; // ENABLE ME TO WORK ON

const render = (mountNode: HTMLElement | null, { plugins, ...restArgs }: RenderAdminArgs) => {
  return renderAdmin(mountNode, {
    ...restArgs,
    plugins: {
      // @ts-expect-error – TODO: fix this
      'content-manager': contentManager,
      'content-type-builder': contentTypeBuilder,
      // @ts-expect-error – TODO: fix this
      email,
      upload,
      // @ts-expect-error – TODO: fix this, the "types" folder has it wrong.
      contentReleases,
      i18n,
      // reviewWorkflows, // ENABLE ME TO WORK ON
      ...plugins,
    },
  });
};

export { render as renderAdmin };
export type { RenderAdminArgs };

export * from '@strapi/admin/strapi-admin';
