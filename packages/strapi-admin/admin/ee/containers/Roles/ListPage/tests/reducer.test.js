import reducer from '../reducer';

describe('ADMIN | CONTAINERS | ROLES | ListPage | reducer', () => {
  describe('DEFAULT_ACTION', () => {
    it('should return the initialState', () => {
      const state = {
        test: true,
      };

      expect(reducer(state, {})).toEqual(state);
    });
  });
  describe('GET_DATA_SUCCEEDED', () => {
    it('should return the state with the role list', () => {
      const action = {
        type: 'GET_DATA_SUCCEEDED',
        data: [
          {
            id: 1,
            name: 'Super admin',
            description: 'This is the super admin role',
          },
        ],
      };
      const initialState = {
        roles: [],
        selectedRoles: [],
      };
      const expected = {
        roles: [
          {
            id: 1,
            name: 'Super admin',
            description: 'This is the super admin role',
          },
        ],
        selectedRoles: [],
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });
  });
  describe('ON_SELECTION', () => {
    it('should add the selected role correctly', () => {
      const action = {
        type: 'ON_SELECTION',
        id: 2,
      };
      const initialState = {
        roles: [
          {
            id: 1,
            name: 'Super admin',
            description: 'This is the super admin role',
          },
          {
            id: 2,
            name: 'Writter',
            description: 'This is the writter role',
          },
        ],
        selectedRoles: [],
      };
      const expected = {
        roles: [
          {
            id: 1,
            name: 'Super admin',
            description: 'This is the super admin role',
          },
          {
            id: 2,
            name: 'Writter',
            description: 'This is the writter role',
          },
        ],
        selectedRoles: [2],
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });
    it('should remove the selected role correctly', () => {
      const action = {
        type: 'ON_SELECTION',
        id: 2,
      };
      const initialState = {
        roles: [
          {
            id: 1,
            name: 'Super admin',
            description: 'This is the super admin role',
          },
          {
            id: 2,
            name: 'Writter',
            description: 'This is the writter role',
          },
        ],
        selectedRoles: [1, 2],
      };
      const expected = {
        roles: [
          {
            id: 1,
            name: 'Super admin',
            description: 'This is the super admin role',
          },
          {
            id: 2,
            name: 'Writter',
            description: 'This is the writter role',
          },
        ],
        selectedRoles: [1],
      };

      expect(reducer(initialState, action)).toEqual(expected);
    });
  });
});
