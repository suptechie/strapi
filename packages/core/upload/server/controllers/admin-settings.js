'use strict';

const { getService } = require('../utils');
const { ACTIONS, FILE_MODEL_UID } = require('../constants');
const validateSettings = require('./validation/admin/settings');

module.exports = {
  async updateSettings(ctx) {
    const {
      request: { body },
      state: { userAbility },
    } = ctx;

    if (userAbility.cannot(ACTIONS.readSettings, FILE_MODEL_UID)) {
      return ctx.forbidden();
    }

    const data = await validateSettings(body);

    await getService('upload').setSettings(data);

    if (data.responsiveDimensions === true) {
      strapi.telemetry.send('didEnableResponsiveDimensions', { adminUser: ctx.state?.user });
    } else {
      strapi.telemetry.send('didDisableResponsiveDimensions', { adminUser: ctx.state?.user });
    }

    ctx.body = { data };
  },

  async getSettings(ctx) {
    const {
      state: { userAbility },
    } = ctx;

    if (userAbility.cannot(ACTIONS.readSettings, FILE_MODEL_UID)) {
      return ctx.forbidden();
    }

    const data = await getService('upload').getSettings();

    ctx.body = { data };
  },
};
