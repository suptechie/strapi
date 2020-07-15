import styled, { css } from 'styled-components';

/* eslint-disable */

const PreviewWysiwygWrapper = styled.div`
  max-height: calc(100% - 70px);
  min-height: 294px;
  overflow: auto;
  padding: 20px 20px 0 20px;
  font-size: 16px;
  background-color: #fff;
  line-height: 24px !important;
  font-family: 'Lato';
  cursor: text;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    line-height: 24px !important;
    font-family: 'Lato';
  }

  h1 {
    margin-top: 11px !important;
    font-size: 36px;
    font-weight: 600;
  }

  h2 {
    margin-top: 26px;
    font-size: 30px;
    font-weight: 500;
  }

  h3 {
    margin-top: 26px;
    font-size: 24px;
    font-weight: 500;
  }

  h4 {
    margin-top: 26px;
    font-size: 20px;
    font-weight: 500;
  }

  blockquote {
    margin-top: 41px;
    margin-bottom: 34px;
    font-size: 16px;
    font-weight: 400;
    border-left: 5px solid #eee;
    font-style: italic;
    padding: 10px 20px;
  }

  img {
    max-width: 100%;
  }

  > table {
    font-size: 13px;
    thead {
      background: rgb(243, 243, 243);
      tr {
        height: 43px;
      }
    }
    tr {
      border: 1px solid #c6cbd1;
    }
    th,
    td {
      padding: 0 25px;
      border: 1px solid #c6cbd1;
      border-bottom: 0;
      border-top: 0;
    }

    tbody {
      tr {
        height: 54px;
      }
    }
  }

  code {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
    color: #212529;
  }

  pre {
    padding: 16px;
    margin-top: 26px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 3px;

    code {
      background-color: transparent;
    }

    span {
      font-family: Consolas, monospace !important;
      font-size: 12px;
      line-height: 16px;
      white-space: pre;
    }
  }

  ${({ isFullscreen }) => {
    if (isFullscreen) {
      return css`
        max-height: calc(100% - 70px) !important;
        margin-bottom: 0;
        margin-top: 9px;
        padding: 10px 20px;
        overflow: auto;
      `;
    }
  }}
`;

export default PreviewWysiwygWrapper;

// h1,
//   h2,
//   h3,
//   h4,
//   h5,
//   h6 {
//     margin: 0;
//     line-height: 24px !important;
//     font-family: 'Lato';
//   }

//   h1 {
//     margin-top: 11px !important;
//     font-size: 36px;
//     font-weight: 600;
//   }

//   h2 {
//     margin-top: 26px;
//     font-size: 30px;
//     font-weight: 500;
//   }

//   h3 {
//     margin-top: 26px;
//     font-size: 24px;
//     font-weight: 500;
//   }

//   h4 {
//     margin-top: 26px;
//     font-size: 20px;
//     font-weight: 500;
//   }

//   > div {
//     > div {
//       > div {
//         margin-bottom: 32px;
//       }
//     }
//   }

//   li {
//     margin-top: 0;
//   }

//   ul,
//   ol {
//     padding: 0;
//     margin-top: 27px;
//   }

//   ol {
//     padding-left: 20px;
//   }

//   span {
//     white-space: pre-line;
//   }

//   h1 + .editorParagraph {
//     margin-top: 31px;
//   }

//   .editorParagraph + * {
//     margin-bottom: -2px !important;
//   }

//   .editorParagraph + .editorBlockquote {
//     margin-bottom: 32px !important;
//   }

//   .editorBlockquote + ul {
//     margin-top: 38px !important;
//   }

//   .editorParagraph {
//     color: #333740;
//     margin-top: 27px;
//     margin-bottom: -3px;
//     font-size: 16px;
//     font-weight: 400;
//   }

//   .editorBlockquote {
// margin-top: 41px;
// margin-bottom: 34px;
// font-size: 16px;
// font-weight: 400;
// border-left: 5px solid #eee;
// font-style: italic;
// padding: 10px 20px;
//   }

//   .unorderedList {
//     padding: 0;
//     margin-left: 18px;
//   }

//   .editorCodeBlock {
// padding: 16px;
// margin-top: 26px;
// padding-bottom: 0;
// background-color: rgba(0, 0, 0, 0.05);
// border-radius: 3px;

// span {
//   font-family: Consolas, monospace !important;
//   font-size: 12px;
//   line-height: 16px;
//   white-space: pre;
// }
//   }

//   .editorInput {
//     height: 0;
//     width: 0;
//   }
