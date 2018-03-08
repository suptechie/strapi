/**
 *
 * ImgPreviewArrow
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';

import styles from './styles.scss';

function ImgPreviewArrow(props) {
  let divStyle = props.show ? {} : { display: 'none' };

  if (props.enable) {
    divStyle = { zIndex: 99999 };
  }

  return (
    <div
      className={cn(
        styles.arrowContainer,
        props.type === 'left' && styles.arrowLeft,
        props.type !== 'left' && styles.arrowRight,
      )}
      style={divStyle}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onClick(props.type);
      }}
    />
  );
}

ImgPreviewArrow.defaultProps = {
  enable: false,
  onClick: () => {},
  show: false,
  type: 'left',
};

ImgPreviewArrow.propTypes = {
  enable: PropTypes.bool,
  onClick: PropTypes.func,
  show: PropTypes.bool,
  type: PropTypes.string,
};

export default ImgPreviewArrow;
