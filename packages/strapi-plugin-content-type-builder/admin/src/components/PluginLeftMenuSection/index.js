/**
*
* PluginLeftMenuSection
*
*/

import React from 'react';
import { map } from 'lodash';
import { FormattedMessage } from 'react-intl';
import PluginLeftMenuLink from 'components/PluginLeftMenuLink';
import styles from './styles.scss';


class PluginLeftMenuSection extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const environmentsRequired = this.props.section.name === 'menu.section.environments';
    const links = map(this.props.section.items, (item, index) => (
      <PluginLeftMenuLink
        key={index}
        link={item}
        environments={this.props.environments}
        environmentsRequired={environmentsRequired}
        envParams={this.props.envParams}
      />
    ));

    return (
      <div className={styles.pluginLeftMenuSection}>
        <p>
          <FormattedMessage {...{id: this.props.section.name}} />
        </p>
        <ul>
          {links}
        </ul>
      </div>
    );
  }
}

PluginLeftMenuSection.propTypes = {
  environments: React.PropTypes.array,
  envParams: React.PropTypes.string,
  section: React.PropTypes.object.isRequired,
};

export default PluginLeftMenuSection;
