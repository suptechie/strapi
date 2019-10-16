import React from 'react';
import PropTypes from 'prop-types';

const RemoveCompo = ({ fill }) => (
  <svg width="8" height="8" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7.78 6.72L5.06 4l2.72-2.72a.748.748 0 0 0 0-1.06.748.748 0 0 0-1.06 0L4 2.94 1.28.22a.748.748 0 0 0-1.06 0 .748.748 0 0 0 0 1.06L2.94 4 .22 6.72a.748.748 0 0 0 0 1.06.748.748 0 0 0 1.06 0L4 5.06l2.72 2.72a.748.748 0 0 0 1.06 0 .752.752 0 0 0 0-1.06z"
      fill={fill}
      fillRule="evenodd"
    />
  </svg>
);

RemoveCompo.defaultProps = {
  fill: '#B3B5B9',
};

RemoveCompo.propTypes = {
  fill: PropTypes.string,
};

export default RemoveCompo;
