import styled from 'styled-components';

interface TrProps {
  isFromDynamicZone?: boolean;
  isChildOfDynamicZone?: boolean;
}

// Keep component-row for css specificity
export const Tr = styled.tr<TrProps>`
  &.component-row,
  &.dynamiczone-row {
    position: relative;
    border-top: none !important;

    table tr:first-child {
      border-top: none;
    }

    > td:first-of-type {
      padding: 0 0 0 ${20 / 16}rem;
      position: relative;

      &::before {
        content: '';
        width: ${4 / 16}rem;
        height: calc(100% - 40px);
        position: absolute;
        top: -7px;
        left: 1.625rem;
        border-radius: 4px;

        ${({ isFromDynamicZone, isChildOfDynamicZone, theme }) => {
          if (isChildOfDynamicZone) {
            return `background-color: ${theme.colors.primary200};`;
          }

          if (isFromDynamicZone) {
            return `background-color: ${theme.colors.primary200};`;
          }

          return `background: ${theme.colors.neutral150};`;
        }}
      }
    }
  }

  &.dynamiczone-row > td:first-of-type {
    padding: 0;
  }
`;
