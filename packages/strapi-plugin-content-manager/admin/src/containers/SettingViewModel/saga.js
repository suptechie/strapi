import { all, fork, put, call, takeLatest, select } from 'redux-saga/effects';
import { request } from 'strapi-helper-plugin';

import pluginId from '../../pluginId';
import { deleteLayout } from '../Main/actions';
import { getDataSucceeded, submitSucceeded } from './actions';
import { GET_DATA, ON_SUBMIT } from './constants';
import { makeSelectModifiedData } from './selectors';

const getRequestUrl = path => `/${pluginId}/fixtures/${path}`;

export function* getData({ uid }) {
  try {
    const { layout } = yield call(request, getRequestUrl(`layouts/${uid}`), {
      method: 'GET',
    });

    yield put(getDataSucceeded(layout));
  } catch (err) {
    strapi.notification.error('notification.error');
  }
}

export function* submit({ emitEvent, uid }) {
  try {
    const body = yield select(makeSelectModifiedData());

    yield call(request, getRequestUrl(`layouts/${uid}`), {
      method: 'PUT',
      body,
    });
    emitEvent('didSaveContentTypeLayout');
    yield put(deleteLayout(uid));
    yield put(submitSucceeded());
  } catch (err) {
    strapi.notification.error('notification.error');
  }
}

function* defaultSaga() {
  try {
    yield all([
      fork(takeLatest, GET_DATA, getData),
      fork(takeLatest, ON_SUBMIT, submit),
    ]);
  } catch (err) {
    // Do nothing
  }
}

export default defaultSaga;
