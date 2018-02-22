/*
 *
 * HomePage actions
 *
 */

import {
  CHANGE_PARAMS,
  DELETE_DATA,
  DELETE_SUCCESS,
  DROP_SUCCESS,
  GET_DATA,
  GET_DATA_SUCCESS,
  ON_DROP,
  ON_SEARCH,
} from './constants';

export function changeParams({ target }) {
  return {
    type: CHANGE_PARAMS,
    keys: target.name.split('.'),
    value: target.value,
  };
}

export function deleteData(dataToDelete) {
  return {
    type: DELETE_DATA,
    dataToDelete,
  };
}

export function deleteSuccess() {
  return {
    type: DELETE_SUCCESS,
  };
}

export function dropSuccess(newFiles) {
  return {
    type: DROP_SUCCESS,
    newFiles,
  };
}

export function getData() {
  return {
    type: GET_DATA,
  };
}

export function getDataSuccess(data, entriesNumber) {
  return {
    type: GET_DATA_SUCCESS,
    data,
    entriesNumber,
  };
}

export function onDrop({ dataTransfer: { files } }) {
  return {
    type: ON_DROP,
    files,
  };
}

export function onSearch({ target }) {
  return {
    type: ON_SEARCH,
    value: target.value,
  };
}
