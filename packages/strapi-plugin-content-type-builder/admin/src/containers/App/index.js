/**
 *
 * App
 *
 */

import React, { Suspense, lazy } from 'react';
import { Switch, Route } from 'react-router-dom';
import { LoadingIndicatorPage } from 'strapi-helper-plugin';
import pluginId from '../../pluginId';
import Wrapper from './Wrapper';

const ListPage = lazy(() => import('../ListPage'));

import RecursivePath from '../RecursivePath';

const App = () => {
  return (
    <Wrapper>
      <Suspense fallback={<LoadingIndicatorPage />}>
        <Switch>
          <Route
            path={`/plugins/${pluginId}/content-types/:uid`}
            component={ListPage}
          />
          <Route
            path={`/plugins/${pluginId}/component-categories/:categoryUid`}
            component={RecursivePath}
          />
        </Switch>
      </Suspense>
    </Wrapper>
  );
};

export default App;
