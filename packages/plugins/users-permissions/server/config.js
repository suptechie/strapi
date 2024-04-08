'use strict';

module.exports = {
  default: ({ env }) => ({
    jwtSecret: env('JWT_SECRET'),
    jwt: {
      expiresIn: '30d',
    },
    ratelimit: {
      interval: 60000,
      max: 10,
    },
    layout: {
      user: {
        actions: {
          create: 'contentManagerUser.create', // Use the User plugin's controller.
          update: 'contentManagerUser.update',
        },
      },
    },
    callback: {
      validate(callback, provider) {
        const uCallback = new URL(callback);
        const uProviderCallback = new URL(provider.callback);

        // Make sure the different origin matches
        if(uCallback.origin !== uProviderCallback.origin)  {
          throw new Error(
            `Forbidden callback provided: origins don't match ${uCallback.origin} !== ${uProviderCallback.origin})`
          );
        }

        // Make sure the different pathname matches
        if(uCallback.pathname !== uProviderCallback.pathname)  {
          throw new Error(
            `Forbidden callback provided: pathname don't match ${uCallback.pathname} !== ${uProviderCallback.pathname})`
          );
        }

        // NOTE: We're not checking the search parameters on purpose to allow passing different states
      }
    },
  }),
  validator() {},
};
