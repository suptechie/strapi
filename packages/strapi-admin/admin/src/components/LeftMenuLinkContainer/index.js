/**
 *
 * LeftMenuLinkContainer
 *
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import { map } from 'lodash';

import LeftMenuLink from 'components/LeftMenuLink';

import styles from './styles.scss';
import messages from './messages.json';

class LeftMenuLinkContainer extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    // Generate the list of sections
    const linkSections = this.props.plugins.valueSeq().map(plugin => (
      plugin.get('leftMenuSections').map((leftMenuSection, j) => {
        return (
          <div key={j}>
            <p className={styles.title}>{leftMenuSection.get('name')}</p>
            <ul className={styles.list}>
              {map(this.links, (link, k) => <LeftMenuLink key={k} icon={link.get('icon') || 'link'} label={link.get('label')} destination={`/plugins/${plugin.get('id')}/${link.get('destination')}`} /> )}
            </ul>
          </div>
        );
      })
    ));

    // Check if the plugins list is empty or not
    const pluginsLinks = this.props.plugins.size
      ? this.props.plugins.valueSeq().map((plugin) => (
        <LeftMenuLink
          key={plugin.get('id')}
          icon={plugin.get('icon') || 'plug'}
          label={plugin.get('name')}
          destination={`/plugins/${plugin.get('id')}`}
        />
      ))
      : (
        <li className={styles.noPluginsInstalled}>
          <FormattedMessage {...messages.noPluginsInstalled} />.
        </li>
      );

    return (
      <div className={styles.leftMenuLinkContainer}>
        {linkSections}
        <div>
          <p className={styles.title}><FormattedMessage {...messages.plugins} /></p>
          <ul className={styles.list}>
            {pluginsLinks}
          </ul>
        </div>
        <div>
          <p className={styles.title}><FormattedMessage {...messages.general} /></p>
          <ul className={styles.list}>
            <LeftMenuLink
              icon="cubes"
              label={messages.listPlugins.id}
              destination="/list-plugins"
            />
            <LeftMenuLink
              icon="download"
              label={messages.installNewPlugin.id}
              destination="/install-plugin"
            />
            <LeftMenuLink
              icon="gear"
              label={messages.configuration.id}
              destination="/configuration"
            />
          </ul>
        </div>
      </div>
    );
  }
}

LeftMenuLinkContainer.propTypes = {
  plugins: React.PropTypes.object.isRequired,
};

export default LeftMenuLinkContainer;
