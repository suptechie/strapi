const { CUSTOM_TRANSFER_TOKEN_ACCESS_KEY } = require('./app-template/template/src/constants');

// NOTE: anything included here needs to be included in all test datasets exports
const ALLOWED_CONTENT_TYPES = [
  'admin::user',
  'admin::role',
  'admin::permission',
  'api::article.article',
  'api::author.author',
  'api::homepage.homepage',
  'api::product.product',
  'api::shop.shop',
  'api::upcoming-match.upcoming-match',
  'api::unique.unique',
  'plugin::i18n.locale',
  'plugin::content-releases.release',
  'plugin::content-releases.release-action',
  /**
   * UPLOADS
   */
  'plugin::upload.file',
];

// TODO: we should start using @strapi.io addresses to have the chance one day to
// actually receive and check the emails; also: it is not nice to spam other peoples
// websites
const ADMIN_EMAIL_ADDRESS = 'test@testing.com';
const ADMIN_PASSWORD = 'Testing123!';

module.exports = {
  ADMIN_EMAIL_ADDRESS,
  ADMIN_PASSWORD,
  ALLOWED_CONTENT_TYPES,
  CUSTOM_TRANSFER_TOKEN_ACCESS_KEY,
};
