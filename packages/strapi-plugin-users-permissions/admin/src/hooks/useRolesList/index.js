import { useEffect, useReducer } from 'react';
import { request } from 'strapi-helper-plugin';
import { get } from 'lodash';
import init from './init';
import pluginId from '../../pluginId';
import reducer, { initialState } from './reducer';

const useRolesList = (shouldFetchData = true) => {
  const [{ roles, isLoading }, dispatch] = useReducer(reducer, initialState, () =>
    init(initialState, shouldFetchData)
  );

  useEffect(() => {
    if (shouldFetchData) {
      fetchRolesList();
    }
  }, [shouldFetchData]);

  const fetchRolesList = async () => {
    try {
      dispatch({
        type: 'GET_DATA',
      });

      const { roles } = await request(`/${pluginId}/roles`, { method: 'GET' });

      dispatch({
        type: 'GET_DATA_SUCCEEDED',
        data: roles,
      });
    } catch (err) {
      const message = get(err, ['response', 'payload', 'message'], 'An error occured');

      dispatch({
        type: 'GET_DATA_ERROR',
      });

      if (message !== 'Forbidden') {
        strapi.notification.error(message);
      }
    }
  };

  return { roles, isLoading, getData: fetchRolesList };
};

export default useRolesList;
