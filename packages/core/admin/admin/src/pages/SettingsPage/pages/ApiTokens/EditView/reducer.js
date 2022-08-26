/* eslint-disable consistent-return */
import produce from 'immer';
import { pull } from 'lodash';

export const initialState = {
  data: {},
  selectedActions: [],
};

const reducer = (state, action) =>
  produce(state, (draftState) => {
    switch (action.type) {
      case 'ON_CHANGE': {
        if (draftState.selectedActions.includes(action.value)) {
          pull(draftState.selectedActions, action.value);
        } else {
          draftState.selectedActions.push(action.value);
        }
        break;
      }
      case 'SELECT_ALL_ACTIONS': {
        draftState.selectedActions = [...draftState.data.allActionsIds];

        break;
      }
      case 'ON_CHANGE_READ_ONLY': {
        const onlyReadOnlyActions = draftState.data.allActionsIds.filter(
          (actionId) => actionId.includes('find') || actionId.includes('findOne')
        );
        draftState.selectedActions = [...onlyReadOnlyActions];
        break;
      }
      default:
        return draftState;
    }
  });

export default reducer;
