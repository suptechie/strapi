import * as React from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionToggle,
  AccordionVariant,
  Box,
  Flex,
  FlexComponent,
  Typography,
  TypographyComponent,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { styled } from 'styled-components';

import { ComponentIcon } from '../../../../../components/ComponentIcon';

interface ComponentCategoryProps {
  category: string;
  components?: Array<{
    uid: string;
    displayName: string;
    icon?: string;
  }>;
  isOpen?: boolean;
  onAddComponent: (
    componentUid: string
  ) => React.MouseEventHandler<HTMLButtonElement> & React.MouseEventHandler<HTMLDivElement>;
  onToggle: (category: string) => void;
  variant?: AccordionVariant;
}

const ComponentCategory = ({
  category,
  components = [],
  variant = 'primary',
  isOpen,
  onAddComponent,
  onToggle,
}: ComponentCategoryProps) => {
  const { formatMessage } = useIntl();

  const handleToggle = () => {
    onToggle(category);
  };

  return (
    <Accordion expanded={isOpen} onToggle={handleToggle} size="S">
      <AccordionToggle
        // @ts-expect-error – Error in the design-system
        variant={variant}
        title={formatMessage({ id: category, defaultMessage: category })}
        togglePosition="left"
      />
      <AccordionContent>
        <Box paddingTop={4} paddingBottom={4} paddingLeft={3} paddingRight={3}>
          <Grid>
            {components.map(({ uid, displayName, icon }) => (
              <ComponentBox
                key={uid}
                tag="button"
                type="button"
                background="neutral100"
                justifyContent="center"
                onClick={onAddComponent(uid)}
                hasRadius
                height="8.4rem"
                shrink={0}
                borderColor="neutral200"
              >
                <Flex direction="column" gap={1} alignItems="center" justifyContent="center">
                  <ComponentIcon icon={icon} />

                  <ComponentName variant="pi" fontWeight="bold" textColor="neutral600">
                    {displayName}
                  </ComponentName>
                </Flex>
              </ComponentBox>
            ))}
          </Grid>
        </Box>
      </AccordionContent>
    </Accordion>
  );
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, 14rem);
  grid-gap: ${({ theme }) => theme.spaces[1]};
`;

const ComponentName = styled<TypographyComponent>(Typography)``;

const ComponentBox = styled<FlexComponent<'button'>>(Flex)`
  &:focus,
  &:hover {
    border: 1px solid ${({ theme }) => theme.colors.primary200};
    background: ${({ theme }) => theme.colors.primary100};

    ${ComponentName} {
      color: ${({ theme }) => theme.colors.primary600};
    }

    /* > Flex > ComponentIcon */
    > div > div:first-child {
      background: ${({ theme }) => theme.colors.primary200};
      color: ${({ theme }) => theme.colors.primary600};
    }
  }
`;

export { ComponentCategory };
export type { ComponentCategoryProps };
