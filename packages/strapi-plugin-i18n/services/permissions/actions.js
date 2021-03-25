'use strict';

const { capitalize, isArray } = require('lodash/fp');
const { getService } = require('../../utils');

const actions = ['create', 'read', 'update', 'delete'].map(uid => ({
  section: 'settings',
  category: 'Internationalization',
  subCategory: 'Locales',
  pluginName: 'i18n',
  displayName: capitalize(uid),
  uid: `locale.${uid}`,
}));

const addLocalesPropertyIfNeeded = ({ value: action }) => {
  const {
    section,
    options: { applyToProperties },
  } = action;

  // Only add the locales property to contentTypes' actions
  if (section !== 'contentTypes') {
    return;
  }

  // If the 'locales' property is already declared within the applyToProperties array, then ignore the next steps
  if (isArray(applyToProperties) && applyToProperties.includes('locales')) {
    return;
  }

  // Add the 'locales' property to the applyToProperties array (create it if necessary)
  action.options.applyToProperties = isArray(applyToProperties)
    ? applyToProperties.concat('locales')
    : ['locales'];
};

const shouldApplyLocalesPropertyToSubject = ({ property, subject }) => {
  if (property === 'locales') {
    const model = strapi.getModel(subject);

    return getService('content-types').isLocalized(model);
  }

  return true;
};

const registerI18nActions = async () => {
  const { actionProvider } = strapi.admin.services.permission;

  await actionProvider.registerMany(actions);
};

const registerI18nActionsHooks = () => {
  const { actionProvider } = strapi.admin.services.permission;

  actionProvider.hooks.appliesPropertyToSubject.register(shouldApplyLocalesPropertyToSubject);
};

const updateActionsProperties = () => {
  const { actionProvider } = strapi.admin.services.permission;

  // Register the transformation for every new action
  actionProvider.hooks.willRegister.register(addLocalesPropertyIfNeeded);

  // Handle already registered actions
  actionProvider.values().forEach(action => addLocalesPropertyIfNeeded({ value: action }));
};

module.exports = {
  actions,
  registerI18nActions,
  registerI18nActionsHooks,
  updateActionsProperties,
};
