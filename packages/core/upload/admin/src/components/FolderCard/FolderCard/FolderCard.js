import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

import { pxToRem } from '@strapi/helper-plugin';
import { Box } from '@strapi/design-system/Box';
import { CardAction } from '@strapi/design-system/Card';
import { Stack } from '@strapi/design-system/Stack';
import Folder from '@strapi/icons/Folder';

import { FolderCardContext } from '../contexts/FolderCard';
import useId from '../hooks/useId';

const FauxClickWrapper = styled.button`
  height: 100%;
  left: 0;
  position: absolute;
  opacity: 0;
  top: 0;
  width: 100%;

  &:hover,
  &:focus {
    text-decoration: none;
  }
`;

const StyledFolder = styled(Folder)`
  path {
    fill: currentColor;
  }
`;

const CardActionDisplay = styled(Box)`
  display: none;
`;

const Card = styled(Box)`
  &:hover,
  &:focus-within {
    ${CardActionDisplay} {
      display: ${({ isCardActions }) => (isCardActions ? 'block' : '')};
    }
  }
`;

export const FolderCard = ({
  children,
  id,
  startAction,
  cardActions,
  ariaLabel,
  onClick,
  to,
  ...props
}) => {
  const generatedId = useId(id);

  return (
    <FolderCardContext.Provider value={{ id: generatedId }}>
      <Card position="relative" tabIndex={0} isCardActions={!!cardActions} {...props}>
        <FauxClickWrapper
          to={to || undefined}
          as={to ? NavLink : 'button'}
          type={to ? undefined : 'button'}
          onClick={onClick}
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-hidden
        />

        <Stack
          hasRadius
          background="neutral0"
          shadow="tableShadow"
          paddingBottom={3}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={3}
          spacing={3}
          horizontal
          cursor="pointer"
        >
          {startAction}

          <Box
            hasRadius
            background="secondary100"
            color="secondary500"
            paddingBottom={2}
            paddingLeft={3}
            paddingRight={3}
            paddingTop={2}
          >
            <StyledFolder width={pxToRem(20)} height={pxToRem(18)} />
          </Box>

          {children}

          <CardActionDisplay>
            <CardAction right={4}>{cardActions}</CardAction>
          </CardActionDisplay>
        </Stack>
      </Card>
    </FolderCardContext.Provider>
  );
};

FolderCard.defaultProps = {
  id: undefined,
  cardActions: null,
  startAction: null,
  to: undefined,
};

FolderCard.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  startAction: PropTypes.element,
  cardActions: PropTypes.element,
  to: PropTypes.string,
};
