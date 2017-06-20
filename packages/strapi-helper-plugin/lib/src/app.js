/**
 * app.js
 *
 * This is the entry file for the application,
 * only setup and plugin code.
 */

import React from 'react';
import { Provider } from 'react-redux';
import { syncHistoryWithStore } from 'react-router-redux';
import App from 'containers/App'; // eslint-disable-line
import { selectLocationState } from 'containers/App/selectors'; // eslint-disable-line
import configureStore from 'store';
import createRoutes from 'routes';
import { translationMessages } from './i18n';

// Plugin identifier based on the package.json `name` value
const pluginPkg = require('../../../../package.json');
const pluginId = pluginPkg.name.replace(
  /^strapi-plugin-/i,
  ''
);
const pluginName = pluginPkg.strapi.name;
const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;
const apiUrl = window.Strapi && `${window.Strapi.apiUrl}/${pluginId}`;
const router = window.Strapi.router;

// Create redux store with history
// this uses the singleton browserHistory provided by react-router
// Optionally, this could be changed to leverage a created history
// e.g. `const browserHistory = useRouterHistory(createBrowserHistory)();`
const store = configureStore({}, window.Strapi.router);

// Sync history and store, as the react-router-redux reducer
// is under the non-default key ("routing"), selectLocationState
// must be provided for resolving how to retrieve the "route" in the state
syncHistoryWithStore(window.Strapi.router, store, {
  selectLocationState: selectLocationState(),
});

// Define the plugin root component
function Comp(props) {
  return (
    <Provider store={store}>
      <App {...props} />
    </Provider>
  );
}

// Add contextTypes to get access to the admin router
Comp.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

// Hot reloadable translation json files
if (module.hot) {
  // modules.hot.accept does not accept dynamic dependencies,
  // have to be constants at compile-time
  module.hot.accept('./i18n', () => {
    if (window.Strapi) {
      System.import('./i18n').then(result => {
        const translationMessagesUpdated = result.translationMessages;
        window.Strapi
          .refresh(pluginId)
          .translationMessages(translationMessagesUpdated);
      });
    }
  });
}

// Register the plugin
window.Strapi.registerPlugin({
  name: pluginPkg.strapi.name,
  icon: pluginPkg.strapi.icon,
  id: pluginId,
  leftMenuLinks: [],
  mainComponent: Comp,
  routes: createRoutes(store),
  translationMessages,
});


// Export store
export { store, apiUrl, pluginId, pluginName, pluginDescription, router };
