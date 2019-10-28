import { fromJS, List } from 'immutable';

const initialState = fromJS({
  collapses: {},
  didCheckErrors: false,
  errors: {},
  componentLayoutsData: {},
  initialData: {},
  isLoading: true,
  isLoadingForLayouts: true,
  modifiedData: {},
  defaultComponentValues: {},
  defaultForm: {},
});

const getMax = arr => {
  if (arr.size === 0) {
    return -1;
  }
  return Math.max.apply(Math, arr.toJS().map(o => o._temp__id));
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_FIELD_TO_COMPONENT':
      return state.updateIn(['modifiedData', ...action.keys], list => {
        const defaultAttribute = state.getIn([
          'defaultComponentValues',
          ...action.keys,
          'defaultRepeatable',
        ]);

        if (action.isRepeatable === false) {
          return fromJS(defaultAttribute);
        }

        if (list) {
          const max = getMax(list);

          return list.push(
            fromJS(
              defaultAttribute
                ? defaultAttribute.set('_temp__id', max + 1)
                : { _temp__id: max + 1 }
            )
          );
        }
        return fromJS([
          defaultAttribute
            ? defaultAttribute.set('_temp__id', 0)
            : { _temp__id: 0 },
        ]);
      });
    case 'ADD_RELATION':
      return state.updateIn(['modifiedData', ...action.keys], list => {
        if (!action.value) {
          return list;
        }

        const el = action.value[0].value;

        if (list) {
          return list.push(fromJS(el));
        }

        return fromJS([el]);
      });
    case 'GET_DATA_SUCCEEDED':
      return state
        .update('defaultForm', () => fromJS(action.defaultForm))
        .update('initialData', () => fromJS(action.data))
        .update('modifiedData', () => fromJS(action.data))
        .update('isLoading', () => false);
    case 'GET_COMPONENT_LAYOUTS_SUCCEEDED': {
      const addTempIdToComponentData = obj => {
        const { defaultComponentValues } = action;

        if (action.isCreatingEntry === true) {
          return obj.keySeq().reduce((acc, current) => {
            if (defaultComponentValues[current]) {
              return acc.set(
                current,
                fromJS(defaultComponentValues[current].toSet)
              );
            }

            return acc;
          }, obj);
        } else {
          return obj.keySeq().reduce((acc, current) => {
            if (
              defaultComponentValues[current] &&
              List.isList(obj.get(current))
            ) {
              const formatted = obj.get(current).reduce((acc2, curr, index) => {
                return acc2.set(index, curr.set('_temp__id', index));
              }, List([]));

              return acc.set(current, formatted);
            }

            return acc;
          }, obj);
        }
      };

      return state
        .update('componentLayoutsData', () => fromJS(action.componentLayouts))
        .update('defaultComponentValues', () =>
          fromJS(action.defaultComponentValues)
        )
        .update('modifiedData', obj => {
          return addTempIdToComponentData(obj);
        })
        .update('initialData', obj => {
          return addTempIdToComponentData(obj);
        })
        .update('isLoadingForLayouts', () => false);
    }

    case 'INIT':
      return initialState
        .set('initialData', fromJS(action.data))
        .set('modifiedData', fromJS(action.data));
    case 'MOVE_FIELD':
      return state.updateIn(['modifiedData', ...action.keys], list => {
        return list
          .delete(action.dragIndex)
          .insert(action.overIndex, list.get(action.dragIndex));
      });

    case 'ON_CHANGE': {
      let newState = state;
      const [nonRepeatableComponentKey] = action.keys;

      if (
        action.keys.length === 2 &&
        state.getIn(['modifiedData', nonRepeatableComponentKey]) === null
      ) {
        newState = state.updateIn(
          ['modifiedData', nonRepeatableComponentKey],
          () => fromJS({})
        );
      }

      return newState.updateIn(['modifiedData', ...action.keys], () => {
        return action.value;
      });
    }

    case 'ON_REMOVE_FIELD':
      return state
        .removeIn(['modifiedData', ...action.keys])
        .updateIn(['modifiedData', action.keys[0]], list => {
          if (action.shouldAddEmptyField) {
            const defaultAttribute = state.getIn([
              'defaultComponentValues',
              action.keys[0],
              'defaultRepeatable',
            ]);
            const max = getMax(list);

            return list.push(defaultAttribute.set('_temp__id', max + 1));
          }

          return list;
        });
    case 'REMOVE_RELATION':
      return state.removeIn(['modifiedData', ...action.keys.split('.')]);
    case 'RESET_FORM':
      return state
        .update('modifiedData', () => state.get('initialData'))
        .update('errors', () => fromJS({}))
        .update('didCheckErrors', v => !v);

    case 'RESET_COMPONENT_DATA': {
      const componentPath = ['modifiedData', action.componentName];

      return state
        .updateIn(
          componentPath,
          () => state.getIn(['defaultForm', action.componentName]) || null
        )
        .update('errors', () => fromJS({}))
        .update('didCheckErrors', v => !v);
    }
    case 'RESET_PROPS':
      return initialState;
    case 'SET_COLLAPSES_COMPONENTS_STATE':
      return state.update('collapses', () => fromJS(action.collapses));
    case 'SET_ERRORS':
      return state
        .update('errors', () => fromJS(action.errors))
        .update('didCheckErrors', v => !v);
    default:
      return state;
  }
}

export default reducer;
export { initialState };
