/**
 *
 * EditViewButton
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useGlobalContext } from 'strapi-helper-plugin';
import { Button } from '@buffetjs/core';

// Create link from content-type-builder to content-manager
function EditViewButton(props) {
  const { formatMessage } = useGlobalContext();
  // Retrieve URL from props
  const base = `${props.getContentTypeBuilderBaseUrl()}${props.getModelName()}`;
  const url =
    props.getSource() === 'users-permissions'
      ? `${base}&source=${props.getSource()}`
      : base;

  const handleClick = () => {
    props.push(url);
  };

  if (props.getSource() === 'admin') {
    return null;
  }

  if (props.currentEnvironment === 'development') {
    return (
      <Button
        {...props}
        onClick={handleClick}
        icon={<i className="fa fa-cog"></i>}
        label={formatMessage({
          id: 'content-manager.containers.Edit.Link.Model',
        })}
        style={{
          paddingLeft: 15,
          paddingRight: 15,
          outline: 0,
        }}
      ></Button>
    );
  }

  return null;
}

EditViewButton.propTypes = {
  currentEnvironment: PropTypes.string.isRequired,
  getContentTypeBuilderBaseUrl: PropTypes.func.isRequired,
  getModelName: PropTypes.func.isRequired,
  getSource: PropTypes.func.isRequired,
  push: PropTypes.func.isRequired,
};

export default EditViewButton;
