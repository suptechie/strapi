import {
  GET_DATA,
  GET_DATA_SUCCEEDED,
  ON_CHANGE_BULK,
  ON_CHANGE_BULK_SELECT_ALL,
  ON_DELETE_DATA_SUCCEEDED,
  ON_DELETE_SEVERAL_DATA_SUCCEEDED,
  RESET_PROPS,
  TOGGLE_MODAL_DELETE,
  TOGGLE_MODAL_DELETE_ALL,
} from './constants';

export function getData() {
  return {
    type: GET_DATA,
  };
}

export function getDataSucceeded(count, data) {
  return {
    type: GET_DATA_SUCCEEDED,
    count,
    data,
  };
}

export function onChangeBulk({ target: { name, value } }) {
  return {
    type: ON_CHANGE_BULK,
    name,
    value,
  };
}

export function onChangeBulkSelectall() {
  return {
    type: ON_CHANGE_BULK_SELECT_ALL,
  };
}

export function onDeleteDataSucceeded() {
  return {
    type: ON_DELETE_DATA_SUCCEEDED,
  };
}

export function onDeleteSeveralDataSucceeded() {
  return {
    type: ON_DELETE_SEVERAL_DATA_SUCCEEDED,
  };
}

export function resetProps() {
  return { type: RESET_PROPS };
}

export function toggleModalDeleteAll() {
  return {
    type: TOGGLE_MODAL_DELETE_ALL,
  };
}

export function toggleModalDelete() {
  return {
    type: TOGGLE_MODAL_DELETE,
  };
}
