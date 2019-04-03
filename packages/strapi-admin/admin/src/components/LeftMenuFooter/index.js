/**
 *
 * LeftMenuFooter
 *
 */

import React, { memo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { PropTypes } from 'prop-types';

import LeftMenuLink from '../LeftMenuLink';

import styles from './styles.scss';
import messages from './messages.json';
defineMessages(messages);

function LeftMenuFooter({ version, ...rest }) {
  // eslint-disable-line react/prefer-stateless-function
  const staticLinks = [
    {
      icon: 'book',
      label: 'documentation',
      destination: 'https://strapi.io/documentation',
    },
    {
      icon: 'question-circle',
      label: 'help',
      destination: 'https://strapi.io/help',
    },
  ];
  return (
    <div className={styles.leftMenuFooter}>
      <ul className={styles.list}>
        {staticLinks.map(link => (
          <LeftMenuLink
            {...rest}
            {...link}
            destination={messages[link.label].id}
            key={link.label}
          />
        ))}
      </ul>
      <div className={styles.poweredBy}>
        <FormattedMessage {...messages.poweredBy} key="poweredBy" />
        <a key="website" href="https://strapi.io" target="_blank">
          Strapi
        </a>{' '}
        <a
          href={`https://github.com/strapi/strapi/releases/tag/v${version}`}
          key="github"
          target="_blank"
        >
          v{version}
        </a>
      </div>
    </div>
  );
}

LeftMenuFooter.propTypes = {
  version: PropTypes.string.isRequired,
};

export default memo(LeftMenuFooter);
