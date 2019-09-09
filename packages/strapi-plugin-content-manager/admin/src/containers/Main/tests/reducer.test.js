import { fromJS } from 'immutable';
import {
  deleteLayout,
  deleteLayouts,
  resetListLabels,
  onChangeListLabels,
} from '../actions';
import mainReducer from '../reducer';

describe('Content Manager | Main | reducer', () => {
  let state;

  beforeEach(() => {
    state = {
      groupsAndModelsMainPossibleMainFields: {},
      groups: [],
      initialLayouts: {
        test: {
          layouts: {
            edit: [],
            editRelations: [],
            list: ['test'],
          },
        },
        otherTest: {
          layouts: {
            edit: [],
            editRelations: [],
            list: ['otherTest'],
          },
        },
      },
      isLoading: true,
      layouts: {
        test: {
          layouts: {
            edit: [],
            editRelations: [],
            list: ['test'],
          },
        },
        otherTest: {
          layouts: {
            edit: [],
            editRelations: [],
            list: ['otherTest'],
          },
        },
      },
      models: [],
    };
  });

  it('should handle the deleteLayout action correctly', () => {
    const expected = {
      ...state,
      layouts: {
        test: { layouts: { edit: [], editRelations: [], list: ['test'] } },
      },
    };

    expect(
      mainReducer(fromJS(state), deleteLayout('otherTest')).toJS()
    ).toEqual(expected);
  });

  it('should handle the deleteLayouts action correctly', () => {
    const expected = { ...state, layouts: {} };
    expect(mainReducer(fromJS(state), deleteLayouts()).toJS()).toEqual(
      expected
    );
  });

  it('should handle the resetListLabels action correctly', () => {
    state.layouts.test.layouts.list.push('label');

    const expected = {
      ...state,
      layouts: {
        test: { layouts: { edit: [], editRelations: [], list: ['test'] } },
        otherTest: {
          layouts: {
            edit: [],
            editRelations: [],
            list: ['otherTest'],
          },
        },
      },
    };

    expect(mainReducer(fromJS(state), resetListLabels('test')).toJS()).toEqual(
      expected
    );
  });

  it('should handle the onChangeListLabels action correctly when adding a new label', () => {
    const expected = {
      ...state,
      layouts: {
        ...state.layouts,
        otherTest: {
          layouts: {
            edit: [],
            editRelations: [],
            list: ['otherTest', 'foo'],
          },
        },
      },
    };

    expect(
      mainReducer(
        fromJS(state),
        onChangeListLabels({ target: { name: 'otherTest.foo', value: true } })
      ).toJS()
    ).toEqual(expected);
  });

  it('should handle the onChangeListLabels action correctly when removing a label', () => {
    state.layouts.otherTest.layouts.list = ['otherTest', 'foo'];
    const expected = {
      ...state,
      layouts: {
        ...state.layouts,
        otherTest: {
          layouts: {
            edit: [],
            editRelations: [],
            list: ['foo'],
          },
        },
      },
    };

    expect(
      mainReducer(
        fromJS(state),
        onChangeListLabels({
          target: { name: 'otherTest.otherTest', value: false },
        })
      ).toJS()
    ).toEqual(expected);
  });
});
