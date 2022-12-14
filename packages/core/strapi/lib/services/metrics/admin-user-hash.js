'use strict';

const crypto = require('crypto');

const generateAdminUserHash = () => {
  const ctx = strapi?.requestContext?.get();
  if (!ctx?.state?.user) {
    return '';
  }
  return crypto.createHash('sha256').update(ctx.state.user.email).digest('hex');
};

module.exports = {
  generateAdminUserHash,
};
