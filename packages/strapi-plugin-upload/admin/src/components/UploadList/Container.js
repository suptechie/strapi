import styled from 'styled-components';
import ContainerFluid from '../ContainerFluid';

const Container = styled(ContainerFluid)`
  margin-bottom: 4px;
  padding-top: 14px;
  max-height: 339px;
  overflow: auto;
  overflow-x: hidden;
  .col-xl-3 {
    padding-right: 6px;
  }
`;

export default Container;
