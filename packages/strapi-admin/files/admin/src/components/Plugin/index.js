/**
*
* Plugin
*
*/

import React from 'react';

import PluginHeader from 'components/PluginHeader';


class Plugin extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div>
        <PluginHeader
          title={this.props.title}
          description={this.props.description}
        />
      </div>
    );
  }
}

Plugin.propTypes = {
  description: React.PropTypes.object.isRequired,
  title: React.PropTypes.object.isRequired,
};

export default Plugin;
