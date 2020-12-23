/**
 *
 * PrivateRoute
 * Higher Order Component that blocks navigation when the user is not logged in
 * and redirect the user to login page
 *
 * Wrap your protected routes to secure your container
 */

import React, { memo } from 'react';
import { Redirect, Route } from 'react-router-dom';
import PropTypes from 'prop-types';
import { auth } from 'strapi-helper-plugin';

const BasePrivateRoute = ({ component: Component, path, ...rest }) => (
  <Route
    path={path}
    render={props =>
      auth.getToken() !== null ? (
        <Component {...rest} {...props} />
      ) : (
        <Redirect
          to={{
            pathname: '/auth/login',
          }}
        />
      )}
  />
);

BasePrivateRoute.propTypes = {
  component: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
  path: PropTypes.string.isRequired,
};

export default memo(BasePrivateRoute);
