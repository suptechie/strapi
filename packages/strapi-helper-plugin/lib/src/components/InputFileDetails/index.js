/**
 *
 * InputFileDetails
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import cn from 'classnames';

import styles from './styles.scss';

function InputFileDetails(props) {
  if (props.number === 0) {
    return <div />;
  }
  
  return (
    <div className={styles.inputFileDetails}>
      <div className={styles.detailBanner} onClick={props.onClick}>
        <div>
          <div className={cn(props.isOpen && styles.chevronDown, !props.isOpen && styles.chevronUp)} />
          <div>
            <FormattedMessage id="app.components.InputFileDetails.details" />
          </div>
        </div>
        <div className={styles.positionContainer}>
          <span>{props.position + 1}/</span>
          <span>{props.number}</span>
        </div>
      </div>
    </div>
  );
}

InputFileDetails.defaultProps = {
  isOpen: false,
  number: 0,
  position: 0,
};

InputFileDetails.propTypes = {
  isOpen: PropTypes.bool,
  number: PropTypes.number,
  position: PropTypes.number,
};

export default InputFileDetails;
