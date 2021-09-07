import React, { useState } from 'react';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestion, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Box } from '@strapi/parts/Box';
import { Text } from '@strapi/parts/Text';
import { FocusTrap } from '@strapi/parts/FocusTrap';
import { useConfigurations } from '../../../hooks';

const Wrapper = styled.button`
  position: fixed;
  bottom: ${({ theme }) => theme.spaces[2]};
  right: ${({ theme }) => theme.spaces[2]};
  width: ${({ theme }) => theme.spaces[8]};
  height: ${({ theme }) => theme.spaces[8]};
  background: ${({ theme }) => theme.colors.primary600};
  box-shadow: ${({ theme }) => theme.shadows.tableShadow};
  border-radius: 50%;

  svg {
    color: white;
  }
`;

const LinksWrapper = styled(Box)`
  position: absolute;
  bottom: ${({ theme }) => `${theme.spaces[9]}`};
  right: 0;
  width: ${200 / 16}rem;
`;

const StyledLink = styled.a`
  display: flex;
  align-items: center;
  width: 100%;
  text-decoration: none;
  padding: ${({ theme }) => theme.spaces[2]};
  padding-left: ${({ theme }) => theme.spaces[5]};

  svg {
    color: ${({ theme }) => theme.colors.neutral600};
    margin-right: ${({ theme }) => theme.spaces[2]};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.neutral100};
    color: ${({ theme }) => theme.colors.neutral500};

    svg {
      color: ${({ theme }) => theme.colors.neutral700};
    }

    ${[Text]} {
      color: ${({ theme }) => theme.colors.neutral700};
    }
  }

  ${[Text]} {
    color: ${({ theme }) => theme.colors.neutral600};
  }
`;

const Onboarding = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { formatMessage } = useIntl();
  const { showTutorials } = useConfigurations();

  if (!showTutorials) {
    return null;
  }

  const staticLinks = [
    {
      icon: 'book',
      label: formatMessage({
        id: 'app.components.LeftMenuFooter.documentation',
        defaultMessage: 'Documentation',
      }),
      destination: 'https://strapi.io/documentation',
    },
    {
      icon: 'file',
      label: formatMessage({ id: 'app.static.links.cheatsheet', defaultMessage: 'CheatSheet' }),
      destination: 'https://strapi-showcase.s3-us-west-2.amazonaws.com/CheatSheet.pdf',
    },
  ];

  const handleClick = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <FocusTrap onEscape={handleClick}>
      <Wrapper onClick={handleClick}>
        {!isOpen && <FontAwesomeIcon icon={faQuestion} />}
        {isOpen && <FontAwesomeIcon icon={faTimes} />}
        {/* FIX ME - replace with popover when overflow popover is fixed 
        + when v4 mockups for onboarding component are ready */}
        {isOpen && (
          <LinksWrapper
            background="neutral0"
            hasRadius
            shadow="tableShadow"
            paddingBottom={2}
            paddingTop={2}
          >
            {staticLinks.map(link => (
              <StyledLink
                key={link.label}
                rel="nofollow noreferrer noopener"
                target="_blank"
                href={link.destination}
              >
                <FontAwesomeIcon icon={link.icon} />
                <Text>{link.label}</Text>
              </StyledLink>
            ))}
          </LinksWrapper>
        )}
      </Wrapper>
    </FocusTrap>
  );
};

export default Onboarding;
