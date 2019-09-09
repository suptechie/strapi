/**
 *
 *
 * ToggleMode
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import styles from './componentsStyles.scss';

const ToggleMode = props => {
  const label = props.isPreviewMode
    ? 'components.Wysiwyg.ToggleMode.markdown'
    : 'components.Wysiwyg.ToggleMode.preview';

  return (
    <div className={styles.toggleModeWrapper}>
      <FormattedMessage id={label}>
        {msg => (
          <button
            type="button"
            className={styles.toggleModeButton}
            onClick={props.onClick}
          >
            {msg}
          </button>
        )}
      </FormattedMessage>
    </div>
  );
};

ToggleMode.defaultProps = {
  isPreviewMode: false,
  onClick: () => {},
};

ToggleMode.propTypes = {
  isPreviewMode: PropTypes.bool,
  onClick: PropTypes.func,
};

export default ToggleMode;
