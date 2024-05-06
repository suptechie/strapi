import { Flex, FlexProps } from '@strapi/design-system';
import styled from 'styled-components';

const MainNavWrapper = styled(Flex)`
  border-right: 1px solid ${({ theme }) => theme.colors.neutral150};
`;

const MainNav = (props: FlexProps<'nav'>) => (
  <MainNavWrapper
    alignItems="normal"
    as="nav"
    background="neutral0"
    direction="column"
    height="100vh"
    position="sticky"
    top={0}
    zIndex={2}
    width={10}
    {...props}
  />
);

export { MainNav };
