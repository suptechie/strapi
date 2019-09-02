import styled, { css } from 'styled-components';

const sizes = {
  small: '35px',
  big: '127px',
  margin: '20px',
};
const max = 4;

const StyledMediaPreviewList = styled.div`
  position: relative;
  height: ${sizes.small};
  > div {
    position: absolute;
    top: 0;
    ${createCSS()};
  }
`;

function createCSS() {
  let styles = '';

  for (let i = 0; i <= max; i += 1) {
    styles += `
      &:nth-of-type(${i}) {
        left: calc( ${sizes.margin} * ${i - 1});
        z-index: ${i};
      }
    `;
  }

  return css`
    ${styles}
  `;
}

//34373F gris +5 FAFAFB

const MediaPreviewItem = styled.div`
  width: ${sizes.small};
  height: ${sizes.small};

  div {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: calc(${sizes.small} / 2);
  }
`;

const MediaPreviewImage = styled(MediaPreviewItem)`
  img {
    display: block;
    object-fit: cover;
  }
  div {
    position: relative;
    &::before {
      content: '-';
      position: absolute;
      width: 100%;
      height: 100%;
      background: white;
      color: transparent;
      opacity: 0;
    }
    img {
      width: 100%;
      height: 100%;
    }
  }
  div + img {
    display: none;
    width: ${sizes.big};
    height: ${sizes.big};
    border-radius: calc(${sizes.big} / 2);
    margin-top: calc(-${sizes.big} - ${sizes.small} - 5px);
    margin-left: calc((-${sizes.big} + ${sizes.small}) / 2);
  }

  &.hoverable {
    :hover {
      z-index: ${max + 1};
      div {
        &::before {
          opacity: 0.6;
        }
      }
      div + img {
        display: block;
      }
    }
  }
`;

export { MediaPreviewImage, MediaPreviewItem, StyledMediaPreviewList };
