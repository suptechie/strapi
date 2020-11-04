/**
 *
 * listView reducer
 */

import produce from 'immer';
import {
  GET_DATA,
  GET_DATA_SUCCEEDED,
  RESET_PROPS,
  ON_CHANGE_BULK,
  ON_CHANGE_BULK_SELECT_ALL,
  ON_DELETE_DATA_ERROR,
  ON_DELETE_DATA_SUCCEEDED,
  ON_DELETE_SEVERAL_DATA_SUCCEEDED,
  TOGGLE_MODAL_DELETE,
  TOGGLE_MODAL_DELETE_ALL,
  //
  ON_CHANGE_LIST_HEADERS,
  ON_RESET_LIST_HEADERS,
  SET_LIST_LAYOUT,
  //
  SET_MODAL_LOADING_STATE,
} from './constants';

export const initialState = {
  count: 0,
  data: [],
  didDeleteData: false,
  entriesToDelete: [],
  isLoading: true,
  showModalConfirmButtonLoading: false,
  showWarningDelete: false,
  showWarningDeleteAll: false,
  //

  contentType: {},
  initialDisplayedHeaders: [],
  displayedHeaders: [],
};

const listViewReducer = (state = initialState, action) =>
  // eslint-disable-next-line consistent-return
  produce(state, drafState => {
    switch (action.type) {
      case GET_DATA:
        return initialState;
      case GET_DATA_SUCCEEDED: {
        drafState.count = action.count;
        drafState.data = action.data;
        drafState.isLoading = false;
        break;
      }
      case ON_CHANGE_BULK: {
        const hasElement = state.entriesToDelete.some(el => el === action.name);

        if (hasElement) {
          drafState.entriesToDelete = drafState.entriesToDelete.filter(el => el !== action.name);
          break;
        }

        drafState.entriesToDelete.push(action.name);
        break;
      }
      case ON_CHANGE_BULK_SELECT_ALL: {
        if (state.entriesToDelete.length > 0) {
          drafState.entriesToDelete = [];

          break;
        }

        drafState.data.forEach(value => {
          drafState.entriesToDelete.push(value.id.toString());
        });

        break;
      }

      case ON_CHANGE_LIST_HEADERS: {
        const {
          target: { name, value },
        } = action;

        if (!value) {
          const { metadatas, attributes } = state.contentType;
          drafState.displayedHeaders.push({
            name,
            fieldSchema: attributes[name],
            metadatas: metadatas[name].list,
            key: `__${name}_key__`,
          });
        } else {
          drafState.displayedHeaders = state.displayedHeaders.filter(
            header => header.name !== name
          );
        }

        break;
      }
      case ON_DELETE_DATA_SUCCEEDED: {
        drafState.didDeleteData = true;
        drafState.showWarningDelete = false;
        break;
      }
      case ON_DELETE_DATA_ERROR: {
        drafState.didDeleteData = false;
        drafState.showWarningDelete = false;
        break;
      }
      case ON_DELETE_SEVERAL_DATA_SUCCEEDED: {
        drafState.didDeleteData = true;
        drafState.showWarningDeleteAll = false;
        break;
      }
      case ON_RESET_LIST_HEADERS: {
        drafState.displayedHeaders = state.initialDisplayedHeaders;
        break;
      }
      case RESET_PROPS: {
        return initialState;
      }
      case SET_MODAL_LOADING_STATE: {
        drafState.showModalConfirmButtonLoading = true;
        break;
      }
      case TOGGLE_MODAL_DELETE: {
        drafState.showModalConfirmButtonLoading = false;

        // Only change this value when the modal is opening
        if (!state.showWarningDelete) {
          drafState.didDeleteData = false;
        }

        drafState.entriesToDelete = [];
        drafState.showWarningDelete = !state.showWarningDelete;

        break;
      }
      case TOGGLE_MODAL_DELETE_ALL: {
        drafState.showModalConfirmButtonLoading = false;

        // Only change this value when the modal is closing
        if (!state.showWarningDeleteAll) {
          drafState.didDeleteData = false;
        }

        drafState.showWarningDeleteAll = !state.showWarningDeleteAll;

        break;
      }
      case SET_LIST_LAYOUT: {
        const { contentType } = action.layout;

        drafState.contentType = contentType;
        drafState.displayedHeaders = contentType.layouts.list;
        drafState.initialDisplayedHeaders = contentType.layouts.list;

        break;
      }

      default:
        return drafState;
    }
  });

export default listViewReducer;
