/*
 *
 * HomePage actions
 *
 */
import { fromJS } from 'immutable';
import { isArray } from 'lodash';
import {
  CANCEL_CHANGES,
  DELETE_DATA,
  DELETE_DATA_SUCCEEDED,
  FETCH_DATA,
  FETCH_DATA_SUCCEEDED,
  ON_CHANGE,
  SET_DATA_TO_EDIT,
  SET_FORM,
  SUBMIT,
  SUBMIT_SUCCEEDED,
  UNSET_DATA_TO_EDIT,
} from './constants';

export function cancelChanges() {
  return {
    type: CANCEL_CHANGES,
  };
}

export function deleteData(dataToDelete, deleteEndPoint) {
  return {
    type: DELETE_DATA,
    dataToDelete,
    deleteEndPoint,
  };
}

export function deleteDataSucceeded(indexDataToDelete) {
  return {
    type: DELETE_DATA_SUCCEEDED,
    indexDataToDelete,
  };
}

export function fetchData(endPoint) {
  return {
    type: FETCH_DATA,
    endPoint,
  };
}

export function fetchDataSucceeded(data) {
  if (!isArray(data)) {
    const list = Object.keys(data).reduce((acc, current) => {
      const obj = Object.assign({ name: current}, data[current]);
      acc.push(obj);

      return acc;
    }, []);

    return {
      type: FETCH_DATA_SUCCEEDED,
      data: list,
      modifiedData: fromJS(data),
    };
  }

  return {
    type: FETCH_DATA_SUCCEEDED,
    data,
    modifiedData: Map({}),
  };
}

export function onChange({ target }) {
  return {
    type: ON_CHANGE,
    keys: ['modifiedData'].concat(target.name.split('.')),
    value: target.value,
  };
}

export function setDataToEdit(dataToEdit) {
  return {
    type: SET_DATA_TO_EDIT,
    dataToEdit,
  };
}

export function setForm(data) {
  // const form = generateForm(formType);
  return {
    type: SET_FORM,
    form: Map(data),
  };
}

export function submit(endPoint) {
  return {
    type: SUBMIT,
    endPoint,
  };
}

export function submitSucceeded() {
  return {
    type: SUBMIT_SUCCEEDED,
  };
}

export function unsetDataToEdit() {
  return {
    type: UNSET_DATA_TO_EDIT,
  };
}

// Utils

// function generateForm(formType) {
//   let form = Map({});
//   switch (formType) {
//     case 'providers':
//       form = Map({
//         provider: 'Facebook',
//         enabled: false,
//       });
//       break;
//     case 'email-templates':
//       form = Map({
//         shipperName: '',
//         shipperEmail: '',
//         responseEmail: '',
//         emailObject: '',
//         message: '',
//       });
//       break;
//     case 'advanced-settings':
//       form = Map({
//         uniqueAccount: false,
//         subscriptions: '100',
//         durations: '24',
//       });
//       break;
//     default:
//   }
//
//   return form;
// }
