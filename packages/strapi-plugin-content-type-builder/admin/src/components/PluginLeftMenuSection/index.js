/**
*
* PluginLeftMenuSection
*
*   - Required props:
*     - {object} section
*
*
*/

import React from 'react';
import { map } from 'lodash';
import { FormattedMessage } from 'react-intl';
import PluginLeftMenuLink from 'components/PluginLeftMenuLink';
import styles from './styles.scss';


class PluginLeftMenuSection extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const links = map(this.props.section.items, (item, index) => (
      <PluginLeftMenuLink
        key={index}
        link={item}
        renderCustomLink={this.props.renderCustomLink}
        basePath={this.props.basePath}
        customIcon={this.props.customIcon}
      />
    ));
    return (
      <div className={styles.pluginLeftMenuSection}>
        <p>
          <FormattedMessage id={this.props.section.name} />
        </p>
        <ul>
          {links}
        </ul>
      </div>
    );
  }
}

PluginLeftMenuSection.propTypes = {
  basePath: React.PropTypes.string,
  customIcon: React.PropTypes.string,
  renderCustomLink: React.PropTypes.func,
  section: React.PropTypes.object.isRequired,
};

export default PluginLeftMenuSection;
