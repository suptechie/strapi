import get from 'lodash/get';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';
import { parse } from 'qs';
import { request, formatComponentData } from 'strapi-helper-plugin';
import pluginId from '../pluginId';

const addCommonFieldsToInitialDataMiddleware = () => ({ getState, dispatch }) => next => action => {
  if (action.type !== 'ContentManager/CrudReducer/INIT_FORM') {
    return next(action);
  }

  if (!action.rawQuery) {
    return next(action);
  }

  const search = action.rawQuery.substring(1);
  const query = parse(search);
  const relatedEntityId = get(query, 'plugins.i18n.relatedEntityId', null);

  if (!relatedEntityId) {
    return next(action);
  }

  const cmDataStore = getState().get('content-manager_editViewCrudReducer');
  const cmLayoutStore = getState().get('content-manager_editViewLayoutManager');
  const { contentTypeDataStructure } = cmDataStore;
  const { currentLayout } = cmLayoutStore;

  const getData = async () => {
    dispatch({ type: 'ContentManager/CrudReducer/GET_DATA' });

    try {
      const requestURL = `${pluginId}/content-manager/actions/get-non-localized-fields`;
      const body = { model: currentLayout.contentType.uid, id: relatedEntityId };

      const { data } = await request(requestURL, { method: 'POST', body });

      const { nonLocalizedFields, localizations } = data;

      const merged = merge(cloneDeep(contentTypeDataStructure, nonLocalizedFields));
      merged.localizations = localizations;

      action.data = formatComponentData(
        merged,
        currentLayout.contentType,
        currentLayout.components
      );
    } catch (err) {
      // Silent
    }

    return next(action);
  };

  return getData();
};

export default addCommonFieldsToInitialDataMiddleware;
