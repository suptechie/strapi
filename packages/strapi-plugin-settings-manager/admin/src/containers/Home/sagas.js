import { LOCATION_CHANGE } from 'react-router-redux';

import { takeLatest } from 'redux-saga';
import { call, take, put, fork, cancel, select } from 'redux-saga/effects';

import request from 'utils/request';

// selectors
import { makeSelectModifiedData } from './selectors';

import {
  CONFIG_FETCH,
  EDIT_SETTINGS,
  LANGUAGE_DELETE,
  LANGUAGES_FETCH,
  NEW_LANGUAGE_POST,
  DATABASES_FETCH,
} from './constants';

import {
  configFetchSucceded,
  databasesFetchSucceeded,
  languagesFetchSucceeded,
  languageActiontSucceded,
} from './actions';

export function* deleteLanguage(action) {
  try {
    const opts = {
      method: 'DELETE',
    };

    const requestUrl = `/settings-manager/configurations/languages/${action.languageToDelete}`;

    yield call(request, requestUrl, opts);

    // TODO remove counter
    yield new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });

    yield put(languageActiontSucceded());

  } catch(error) {
    window.Strapi.notification.error('An Error occured');
  }
}

export function* fetchConfig(action) {
  try {
    const opts = {
      method: 'GET',
    };

    const requestUrl = `/settings-manager/configurations/${action.endPoint}`;
    const data = yield call(request, requestUrl, opts);

    yield put(configFetchSucceded(data));

  } catch(error) {
    window.Strapi.notification.error('An error occurred ');
  }
}


export function* fetchDatabases(action) {
  try {
    const opts = {
      method: 'GET',
    };

    const requestUrlListDatabases = `/settings-manager/configurations/databases/${action.environment}`;
    const requestUrlAppDatabases = '/settings-manager/configurations/database/model';

    const [listDatabasesData, appDatabaseData] = yield [
      call(request, requestUrlListDatabases, opts),
      call(request, requestUrlAppDatabases, opts),
    ];

    yield put(databasesFetchSucceeded(listDatabasesData, appDatabaseData));

  } catch(error) {
    window.Strapi.notification.error('An error occurred');
  }
}

export function* fetchLanguages() {
  try {
    const opts = {
      method: 'GET',
    };

    const requestUrlAppLanguages = '/settings-manager/configurations/languages';
    const requestUrlListLanguages = '/settings-manager/configurations/i18n';

    const [appLanguagesData, listLanguagesData] = yield [
      call(request, requestUrlAppLanguages, opts),
      call(request, requestUrlListLanguages, opts),
    ];

    yield put(languagesFetchSucceeded(appLanguagesData, listLanguagesData));

  } catch(error) {
    window.Strapi.notification.error('An error occurred');
  }
}

export function* postLanguage() {
  try {
    const newLanguage = yield select(makeSelectModifiedData());
    const body = {
      name: newLanguage['i18n.i18n.defaultLocale'],
    };
    const opts = {
      body,
      method: 'POST',
    };

    const requestUrl = '/settings-manager/configurations/languages';

    yield call(request, requestUrl, opts);

    // TODO remove counter
    yield new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });

    yield put(languageActiontSucceded());

  } catch(error) {
    console.log(error);
    // TODO handle error i18n
    window.Strapi.notification.error(error);
  }
}

export function* settingsEdit(action) {
  try {
    const opts = {
      body: action.newSettings,
      method: 'PUT',
    };

    const requestUrl = `settings-manager/configurations/${action.endPoint}`;

    yield  call(request, requestUrl, opts);



    // TODO handle server reload to get response
    window.Strapi.notification.success('Your modifications have been updated');

    // TODO uncomment following
    // const data = yield call(request, requestUrl, { method: 'GET' });

    // yield put(editSettingsSucceeded(data));

  } catch(error) {
    window.Strapi.notification.error('An error occured');
  }
}

// Individual exports for testing
export function* defaultSaga() {
  const loadConfigWatcher = yield fork(takeLatest, CONFIG_FETCH, fetchConfig);
  const loadLanguagesWatcher = yield fork(takeLatest, LANGUAGES_FETCH, fetchLanguages);
  const editConfigWatcher = yield fork(takeLatest, EDIT_SETTINGS, settingsEdit);
  const postLanguageWatcher = yield fork(takeLatest, NEW_LANGUAGE_POST, postLanguage);
  const deleteLanguageWatcher = yield fork(takeLatest, LANGUAGE_DELETE, deleteLanguage);
  const loadDatabasesWatcher = yield fork(takeLatest, DATABASES_FETCH, fetchDatabases);

  yield take(LOCATION_CHANGE);
  yield cancel(loadConfigWatcher);
  yield cancel(loadLanguagesWatcher);
  yield cancel(editConfigWatcher);
  yield cancel(postLanguageWatcher);
  yield cancel(deleteLanguageWatcher);
  yield cancel(loadDatabasesWatcher);

}

// All sagas to be loaded
export default [
  defaultSaga,
];
