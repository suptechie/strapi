/* eslint-disable */
import React from 'react';

const STSelected = props => (
  <svg width="53px" height="60px" viewBox="0 0 61 68" {...props}>
    <defs>
      <filter
        x="-1.7%"
        y="-2.3%"
        width="103.5%"
        height="104.7%"
        filterUnits="objectBoundingBox"
        id="filter-1"
      >
        <feOffset dx="0" dy="2" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
        <feGaussianBlur
          stdDeviation="2"
          in="shadowOffsetOuter1"
          result="shadowBlurOuter1"
        ></feGaussianBlur>
        <feColorMatrix
          values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.05 0"
          type="matrix"
          in="shadowBlurOuter1"
          result="shadowMatrixOuter1"
        ></feColorMatrix>
        <feMerge>
          <feMergeNode in="shadowMatrixOuter1"></feMergeNode>
          <feMergeNode in="SourceGraphic"></feMergeNode>
        </feMerge>
      </filter>
    </defs>
    <g id="Prototype---Single-types" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g
        id="Plugins-/-Types-Builder-/-Single-page-settings"
        transform="translate(-849.000000, -452.000000)"
      >
        <g
          id="Modal---Edit-Single-Type"
          filter="url(#filter-1)"
          transform="translate(323.000000, 145.000000)"
        >
          <g id="Single-content-type" transform="translate(476.000000, 269.000000)">
            <g id="file-text-o" transform="translate(59.000000, 47.000000)">
              <rect
                id="Rectangle"
                fill="#E4F0FC"
                x="1.69491525"
                y="3.38983051"
                width="30.5084746"
                height="44.0677966"
              ></rect>
              <rect
                id="Rectangle"
                fill="#E4F0FC"
                x="31.2033898"
                y="16.1016949"
                width="8.47457627"
                height="31.3559322"
              ></rect>
              <polygon
                id="Path-2"
                fill="#E4F0FC"
                points="29.2372881 3.38983051 40.6779661 15.2542373 29.2372881 16.1016949 26.9365731 15.2542373 26.9365731 3.38983051"
              ></polygon>
              <path
                d="M40.4969986,10.4828743 C41.0119468,10.9978225 41.453331,11.6966808 41.8211511,12.5794492 C42.1889713,13.4622175 42.3728814,14.2714218 42.3728814,15.0070621 L42.3728814,46.7867232 C42.3728814,47.5223635 42.1154073,48.1476577 41.600459,48.6626059 C41.0855108,49.1775541 40.4602166,49.4350282 39.7245763,49.4350282 L2.64830508,49.4350282 C1.91266478,49.4350282 1.28737053,49.1775541 0.772422316,48.6626059 C0.257474105,48.1476577 0,47.5223635 0,46.7867232 L0,2.64830508 C0,1.91266478 0.257474105,1.28737053 0.772422316,0.772422316 C1.28737053,0.257474105 1.91266478,0 2.64830508,0 L27.3658192,0 C28.1014595,0 28.9106638,0.183910075 29.7934322,0.551730226 C30.6762006,0.919550377 31.3750589,1.36093456 31.8900071,1.87588277 L40.4969986,10.4828743 Z M28.2485876,3.75176554 L28.2485876,14.1242938 L38.6211158,14.1242938 C38.4372057,13.5909546 38.2349047,13.2139389 38.0142126,12.9932468 L29.3796345,4.35866879 C29.1589424,4.13797669 28.7819268,3.93567561 28.2485876,3.75176554 Z M38.8418079,45.9039548 L38.8418079,17.6553672 L27.3658192,17.6553672 C26.6301789,17.6553672 26.0048847,17.3978931 25.4899364,16.8829449 C24.9749882,16.3679967 24.7175141,15.7427024 24.7175141,15.0070621 L24.7175141,3.53107345 L3.53107345,3.53107345 L3.53107345,45.9039548 L38.8418079,45.9039548 Z M10.5932203,22.069209 C10.5932203,21.8117349 10.6759799,21.6002383 10.8414989,21.4347193 C11.007018,21.2692002 11.2185146,21.1864407 11.4759887,21.1864407 L30.8968927,21.1864407 C31.1543668,21.1864407 31.3658633,21.2692002 31.5313824,21.4347193 C31.6969015,21.6002383 31.779661,21.8117349 31.779661,22.069209 L31.779661,23.8347458 C31.779661,24.0922199 31.6969015,24.3037165 31.5313824,24.4692355 C31.3658633,24.6347546 31.1543668,24.7175141 30.8968927,24.7175141 L11.4759887,24.7175141 C11.2185146,24.7175141 11.007018,24.6347546 10.8414989,24.4692355 C10.6759799,24.3037165 10.5932203,24.0922199 10.5932203,23.8347458 L10.5932203,22.069209 Z M30.8968927,28.2485876 C31.1543668,28.2485876 31.3658633,28.3313471 31.5313824,28.4968662 C31.6969015,28.6623852 31.779661,28.8738818 31.779661,29.1313559 L31.779661,30.8968927 C31.779661,31.1543668 31.6969015,31.3658633 31.5313824,31.5313824 C31.3658633,31.6969015 31.1543668,31.779661 30.8968927,31.779661 L11.4759887,31.779661 C11.2185146,31.779661 11.007018,31.6969015 10.8414989,31.5313824 C10.6759799,31.3658633 10.5932203,31.1543668 10.5932203,30.8968927 L10.5932203,29.1313559 C10.5932203,28.8738818 10.6759799,28.6623852 10.8414989,28.4968662 C11.007018,28.3313471 11.2185146,28.2485876 11.4759887,28.2485876 L30.8968927,28.2485876 Z M30.8968927,35.3107345 C31.1543668,35.3107345 31.3658633,35.393494 31.5313824,35.5590131 C31.6969015,35.7245321 31.779661,35.9360287 31.779661,36.1935028 L31.779661,37.9590395 C31.779661,38.2165137 31.6969015,38.4280102 31.5313824,38.5935293 C31.3658633,38.7590484 31.1543668,38.8418079 30.8968927,38.8418079 L11.4759887,38.8418079 C11.2185146,38.8418079 11.007018,38.7590484 10.8414989,38.5935293 C10.6759799,38.4280102 10.5932203,38.2165137 10.5932203,37.9590395 L10.5932203,36.1935028 C10.5932203,35.9360287 10.6759799,35.7245321 10.8414989,35.5590131 C11.007018,35.393494 11.2185146,35.3107345 11.4759887,35.3107345 L30.8968927,35.3107345 Z"
                id="Shape"
                fill="#A5D5FF"
                fillRule="nonzero"
              ></path>
            </g>
          </g>
        </g>
      </g>
    </g>
  </svg>
);

export default STSelected;
