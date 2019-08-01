import styled from 'styled-components';

const Wrapper = styled.div`
  position: relative;
  margin-top: 14px;
  margin-bottom: -14px;
  line-height: 18px;

  > div {
    border-radius: 3px;

    > div:last-of-type {
      min-height: 320px;
      max-height: 635px;
      font-weight: 500;
      font-size: 1.3rem !important;
    }
  }

  .colored {
    background-color: yellow;
    color: black !important;
  }
`;

export default Wrapper;
