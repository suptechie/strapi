/*
 *
 * PluginPage
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { createSelector } from 'reselect';
import { selectPlugins } from 'containers/App/selectors';
import PluginHeader from 'components/PluginHeader';

const exposedComponents = {
  PluginHeader,
};

export class PluginPage extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const containers = this.props.plugins.valueSeq().map((plugin, i) => {
      const Elem = plugin.get('mainComponent');
      return <Elem key={i} {...this.props} exposedComponents={exposedComponents}></Elem>;
    });

    return (
      <div>
        <Helmet
          title="Strapi - Plugin"
          meta={[
            { name: 'description', content: 'Description of PluginPage' },
          ]}
        />
        {containers}
      </div>
    );
  }
}

PluginPage.contextTypes = {
  router: React.PropTypes.object.isRequired,
};

PluginPage.propTypes = {
  plugins: React.PropTypes.object,
};

const mapStateToProps = createSelector(
  selectPlugins(),
  (plugins) => ({ plugins })
);

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PluginPage);
