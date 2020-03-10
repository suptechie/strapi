import React from 'react';
import PropTypes from 'prop-types';

import Text from '../Text';
import CardImgWrapper from '../CardImgWrapper';
import CardPreview from '../CardPreview';
import Wrapper from './Wrapper';
import Title from './Title';
import ErrorMessage from './ErrorMessage';
import Border from './Border';

const Card = ({
  checked,
  children,
  errorMessage,
  hasError,
  mime,
  name,
  small,
  size,
  type,
  url,
}) => {
  return (
    <Wrapper>
      <CardImgWrapper small={small} checked={checked} hasError={hasError}>
        <CardPreview type={mime || type} url={url} hasError={hasError} />
        <Border shown={checked || hasError} color={hasError ? 'orange' : 'mediumBlue'} />
        {children}
      </CardImgWrapper>
      <Title fontSize="md" fontWeight="bold" ellipsis>
        {name}
      </Title>
      <Text color="grey" fontSize="xs" ellipsis>{`${type} - ${size}`}</Text>
      {hasError && <ErrorMessage>yoyo {errorMessage}</ErrorMessage>}
    </Wrapper>
  );
};

Card.defaultProps = {
  checked: false,
  children: null,
  errorMessage: null,
  hasError: false,
  mime: null,
  name: null,
  size: 0,
  small: false,
  type: null,
  url: null,
};

Card.propTypes = {
  checked: PropTypes.bool,
  children: PropTypes.node,
  errorMessage: PropTypes.string,
  hasError: PropTypes.bool,
  mime: PropTypes.string,
  name: PropTypes.string,
  size: PropTypes.number,
  small: PropTypes.bool,
  type: PropTypes.string,
  url: PropTypes.string,
};

export default Card;
