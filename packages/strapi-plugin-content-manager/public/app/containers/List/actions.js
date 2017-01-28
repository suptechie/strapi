/*
 *
 * List actions
 *
 */

import {
  LOAD_RECORDS,
  LOADED_RECORDS
} from './constants';

export function loadRecords(model) {
  return {
    type: LOAD_RECORDS,
    model
  };
}

export function loadedRecord(records, models) {
  return {
    type: LOADED_RECORDS,
    records,
    models
  };
}
