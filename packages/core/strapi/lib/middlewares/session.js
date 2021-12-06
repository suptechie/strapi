'use strict';

const uuid = require('uuid/v4');
const { defaultsDeep, isEmpty, omit, has } = require('lodash/fp');
const session = require('koa-session');

const defaultConfig = {
  key: 'koa.sess',
  maxAge: 86400000,
  autoCommit: true,
  overwrite: true,
  httpOnly: true,
  signed: true,
  rolling: false,
  renew: false,
  secure: false,
  sameSite: null,
};

module.exports = (userConfig, { strapi }) => {
  if (isEmpty(strapi.server.app.keys)) {
    let secretKeys = [];

    if (has('secretKeys', userConfig)) {
      secretKeys = userConfig.secretKeys;
    } else if (has('SESSION_SECRET_KEYS', process.env)) {
      secretKeys = process.env.SESSION_SECRET_KEYS.split(',');
    } else {
      // auto generate secret keys if they are not provided
      for (let i = 0; i < 4; i++) {
        secretKeys.push(uuid());
      }
      strapi.fs.appendFile('.env', `SESSION_SECRET_KEYS=${secretKeys.join(',')}\n`);
      console.log(
        'ℹ️  The session middleware automatically generated some secret keys and stored them in your .env file under the name SESSION_SECRET_KEYS.'
      );
    }

    strapi.server.app.keys = secretKeys;
  }

  const config = defaultsDeep(defaultConfig, omit('secretKeys', userConfig));

  strapi.server.use(session(config, strapi.server.app));
  strapi.server.use((ctx, next) => {
    ctx.state = defaultsDeep({ session: {} }, ctx.state);

    return next();
  });
};
