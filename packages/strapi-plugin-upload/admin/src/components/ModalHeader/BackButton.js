/*
 *
 *
 * BackButton
 *
 */
import styled from 'styled-components';

const BackButton = styled.button`
  height: 6rem;
  width: 6.5rem;
  margin-right: 20px;
  margin-left: -30px;
  line-height: 6rem;
  text-align: center;
  color: #81848a;
  border-right: 1px solid #f3f4f4;
  &:before {
    content: '\f053';
    font-family: 'FontAwesome';
    font-size: ${({ theme }) => theme.main.sizes.font.lg};
    font-weight: ${({ theme }) => theme.main.fontWeights.bold};
  }
  &:hover {
    background-color: #f3f4f4;
  }
`;

export default BackButton;
