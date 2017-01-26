import { takeLatest } from 'redux-saga';
import { put } from 'redux-saga/effects';

import {
  loadedRecord,
} from './actions';

import {
  LOAD_RECORDS,
} from './constants';

export function* getRecords() {
  const fakeData = [{
    id: 1,
    title: 'Roger Federer has won the first set.',
    message: 'Try to do better than that man and you will be a winner.'
  }, {
    id: 2,
    title: 'Lewis Hamilton is on fire.',
    message: 'Did you ever seen someone like that guy?'
  }, {
    id: 3,
    title: 'Elon Musk is awesome!',
    message: 'Space X, Paypal, Tesla, & cie.'
  }];

  yield put(loadedRecord(fakeData));
}


// Individual exports for testing
export function* defaultSaga() {
  yield takeLatest(LOAD_RECORDS, getRecords);
}

// All sagas to be loaded
export default [
  defaultSaga,
];
