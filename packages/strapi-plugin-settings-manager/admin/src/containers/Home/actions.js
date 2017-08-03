/*
*
* Home actions
*
*/

import { forEach, has } from 'lodash';
import {
  CONFIG_FETCH,
  LANGUAGES_FETCH,
  CONFIG_FETCH_SUCCEEDED,
  LANGUAGES_FETCH_SUCCEEDED,
  CHANGE_INPUT,
  CANCEL_CHANGES,
  DEFAULT_ACTION,
  EDIT_SETTINGS,
  EDIT_SETTINGS_SUCCEEDED,
  CHANGE_DEFAULT_LANGUAGE,
  NEW_LANGUAGE_POST,
  LANGUAGE_ACTION_SUCCEEDED,
  LANGUAGE_DELETE,
  DATABASES_FETCH,
  DATABASES_FETCH_SUCCEEDED,
} from './constants';

export function defaultAction() {
  return {
    type: DEFAULT_ACTION,
  }
}

export function configFetch(endPoint) {
  return {
    type: CONFIG_FETCH,
    endPoint,
  };
}

export function configFetchSucceded(configs) {
  const data = getDataFromConfigs(configs);

  return {
    type: CONFIG_FETCH_SUCCEEDED,
    configs,
    data,
  };
}

export function changeInput(key, value) {
  return {
    type: CHANGE_INPUT,
    key,
    value,
  };
}

export function cancelChanges() {
  return {
    type: CANCEL_CHANGES,
  };
}


export function languagesFetch() {
  return {
    type: LANGUAGES_FETCH,
  };
}

export function languagesFetchSucceeded(appLanguages, listLanguages) {
  const configs = {
    name: listLanguages.name,
    description: listLanguages.description,
    sections: appLanguages.languages,
  };

  return {
    type: LANGUAGES_FETCH_SUCCEEDED,
    configs,
    listLanguages,
  };
}


export function editSettings(newSettings, endPoint) {
  return {
    type: EDIT_SETTINGS,
    newSettings,
    endPoint,
  };
}

export function editSettingsSucceeded(optimisticResponse) {
  const data = getDataFromConfigs(optimisticResponse);

  return {
    type: EDIT_SETTINGS_SUCCEEDED,
    optimisticResponse,
    data,
  };
}


function getDataFromConfigs(configs) {
  const data = {};

  forEach(configs.sections, (section) => {
    forEach(section.items, (item) => {
      data[item.target] = item.value;

      if (has(item, 'items')) {
        forEach(item.items, (itemValue) => {
          data[itemValue.target] = itemValue.value;
        })
      }
    });
  });

  return data;
}

export function changeDefaultLanguage(configsDisplay, newLanguage) {
  return {
    type: CHANGE_DEFAULT_LANGUAGE,
    configsDisplay,
    newLanguage,
  };
}

export function newLanguagePost() {
  return {
    type: NEW_LANGUAGE_POST,
  };
}


export function languageActiontSucceded() {
  return {
    type: LANGUAGE_ACTION_SUCCEEDED,
  };
}

export function languageDelete(languageToDelete) {
  return {
    type: LANGUAGE_DELETE,
    languageToDelete,
  };
}


export function databasesFetch(environment) {
  return {
    type: DATABASES_FETCH,
    environment,
  };
}

export function databasesFetchSucceeded(listDatabases, appDatabases) {
  const configsDisplay = {
    name: 'form.databases.name',
    description: 'form.databases.description',
    sections: listDatabases.databases,
  };

  const modifiedData = {
    'databases.defaultConnection': false,
  };

  return {
    type: DATABASES_FETCH_SUCCEEDED,
    configsDisplay,
    appDatabases,
    modifiedData,
  };
}
