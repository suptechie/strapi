/**
 * app.js
 *
 * This is the entry file for the application,
 * only setup and plugin code.
 */

import React from 'react';
import { Provider } from 'react-redux';
import { syncHistoryWithStore } from 'react-router-redux';

import App from './containers/App';
import createRoutes from './routes';
import configureStore from './store';
import { selectLocationState } from './containers/App/selectors';
import { translationMessages } from './i18n';

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

// Plugin identifier based on the package.json `name` value
const pluginId = require('../package.json').name.replace(
  /^strapi-plugin-/i,
  ''
);

// Define Strapi admin router
let router; // eslint-disable-line import/no-mutable-exports

class comp extends React.Component {
  componentWillMount() {
    // Expose Strapi admin router
    router = this.context.router;
  }

  render() {
    return (
      <Provider store={store}>
        <App {...this.props} />
      </Provider>
    );
  }
}

comp.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

// Register the plugin
if (window.Strapi) {
  window.Strapi.registerPlugin({
    name: 'Content Manager',
    icon: 'ion-document-text',
    id: pluginId,
    leftMenuLinks: [],
    mainComponent: comp,
    routes: createRoutes(store),
    translationMessages,
  });
}

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

// API
const apiUrl = window.Strapi && `${window.Strapi.apiUrl}/${pluginId}`;

// Export store
export { store, apiUrl, pluginId, router };
