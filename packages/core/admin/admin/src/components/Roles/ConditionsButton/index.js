import { Settings } from '@strapi/icons';
import { Button } from '@strapi/parts';
import PropTypes from 'prop-types';
import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: relative;

  ${({ hasConditions, disabled, theme }) =>
    hasConditions &&
    `
    &:before {
      content: '';
      position: absolute;
      top: -3px;
      left: -10px;
      width: 6px;
      height: 6px;
      border-radius: 20px;
      background: ${disabled ? theme.colors.neutral100 : theme.colors.primary600};
    }
  `}
`;

const ConditionsButton = ({ onClick, className, hasConditions, variant }) => {
  const { formatMessage } = useIntl();

  return (
    <Wrapper hasConditions={hasConditions} className={className}>
      <Button variant={variant} startIcon={<Settings />} onClick={onClick}>
        {formatMessage({
          id: 'app.components.LeftMenuLinkContainer.settings',
          defaultMessage: 'Settings',
        })}
      </Button>
    </Wrapper>
  );
};

ConditionsButton.defaultProps = {
  className: null,
  hasConditions: false,
  variant: 'secondary',
};
ConditionsButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
  hasConditions: PropTypes.bool,
  variant: PropTypes.string,
};

// This is a styled component advanced usage :
// Used to make a ref to a non styled component.
// https://styled-components.com/docs/advanced#caveat
export default styled(ConditionsButton)``;
