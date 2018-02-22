import { LOCATION_CHANGE } from 'react-router-redux';
import { Map } from 'immutable';
import { call, fork, put, select, take, takeLatest } from 'redux-saga/effects';
import request from 'utils/request';

import {
  deleteSuccess,
  dropSuccess,
  getDataSuccess,
} from './actions';
import {
  DELETE_DATA,
  GET_DATA,
  ON_DROP,
  ON_SEARCH,
} from './constants';
import {
  // makeSelectParams,
  makeSelectSearch,
} from './selectors';

function* dataDelete(action) {
  try {
    const dataId = action.dataToDelete.id || action.dataToDelete._id;
    const requestURL = `/upload/files/${dataId}`;
    yield call(request, requestURL, { method: 'DELETE' });
    yield put(deleteSuccess());
    strapi.notification.success('upload.notification.delete.success');
  } catch(err) {
    console.log(err);
  }
}

function* dataGet() {
  try {
    // const pageParams = yield select(makeSelectParams());
    // const skip = ( pageParams.page - 1) * pageParams.limit;
    // const params = {
    //   limit: pageParams.limit,
    //   sort: pageParams.sort,
    //   skip,
    // };

    const data = yield [
      call(request, '/upload/files', { method: 'GET', params: {} }),
      call(request, '/upload/files/count', { method: 'GET' }),
    ];
    const entries = data[0].length === 0 ? [Map({})] : data[0].map(obj => Map(obj));
    yield put(getDataSuccess(entries, data[1].count));
  } catch(err) {
    strapi.notification.error('notification.error');
  }
}

function* uploadFiles(action) {
  try {
    const headers = {
      'X-Forwarded-Host': 'strapi',
    };
    const response = yield call(request, '/upload', { method: 'POST', headers, body: action.formData }, false, false);
    const newFiles = response.map(file => Map(file));

    yield put(dropSuccess(newFiles));

    if (newFiles.length > 1) {
      strapi.notification.success({ id: 'upload.notification.dropFile.success' });
    } else {
      strapi.notification.success({ id: 'upload.notification.dropFiles.success', values: { number: newFiles.length } });
    }

  } catch(err) {
    strapi.notification.error('notification.error');
  }
}

function* search() {
  try {
    const search = yield select(makeSelectSearch());
    console.log('will search', search);
  } catch(err) {
    console.log(err);
    strapi.notification.error('notification.error');
  }
}


// Individual exports for testing
export function* defaultSaga() {
  yield fork(takeLatest, DELETE_DATA, dataDelete);
  yield fork(takeLatest, ON_DROP, uploadFiles);
  yield fork(takeLatest, ON_SEARCH, search);

  const loadDataWatcher = yield fork(takeLatest, GET_DATA, dataGet);

  yield take(LOCATION_CHANGE);

  yield cancel(loadDataWatcher);
}

// All sagas to be loaded
export default defaultSaga;
