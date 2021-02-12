import produce from 'immer';
import { set } from 'lodash';

const initialState = {
  initialData: {},
  modifiedData: {
    collectionTypes: {
      address: {
        'content-manager.explorer.create': {
          fields: {
            postal_coder: true,
            categories: false,
            cover: true,
            images: true,
            city: true,
          },
          conditions: {
            'admin::is-creator': false,
            'admin::has-same-role-as-creator': false,
          },
        },
        'content-manager.explorer.read': {
          fields: {
            postal_coder: true,
            categories: false,
            cover: true,
            images: true,
            city: true,
          },
          conditions: {
            'admin::is-creator': false,
            'admin::has-same-role-as-creator': false,
          },
        },
        'content-manager.explorer.update': {
          fields: {
            postal_coder: true,
            categories: false,
            cover: true,
            images: true,
            city: true,
          },
          conditions: {
            'admin::is-creator': false,
            'admin::has-same-role-as-creator': false,
          },
        },
      },
      restaurant: {
        'content-manager.explorer.create': {
          fields: {
            f1: true,
            f2: true,
            services: {
              name: true,
              media: true,
              closing: {
                name: {
                  test: true,
                },
              },
            },
            dz: true,
            relation: true,
          },
          locales: {
            fr: true,
            en: true,
          },
        },
        'content-manager.explorer.read': {
          fields: {
            f1: true,
            f2: true,
            services: {
              name: true,
              media: true,
              closing: {
                name: {
                  test: true,
                },
              },
            },
            dz: true,
            relation: true,
          },
          locales: {
            fr: true,
            en: true,
          },
        },
      },
    },
  },
};

/* eslint-disable consistent-return */
const reducer = (state, action) =>
  produce(state, draftState => {
    switch (action.type) {
      case 'ON_CHANGE_TOGGLE_PARENT_CHECKBOX': {
        break;
      }
      case 'ON_CHANGE_SIMPLE_CHECKBOX': {
        set(draftState, ['modifiedData', ...action.keys.split('..')], action.value);
        break;
      }
      default:
        return draftState;
    }
  });

export default reducer;
export { initialState };
