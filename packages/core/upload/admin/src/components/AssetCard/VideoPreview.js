/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@strapi/design-system/Box';

const VideoPreviewWrapper = styled(Box)`
  canvas,
  video {
    display: block;
    max-width: 100%;
    max-height: ${({ size }) => (size === 'M' ? 164 / 16 : 88 / 16)}rem;
  }
`;

// According to MDN
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState#value
const HAVE_FUTURE_DATA = 3;

export const VideoPreview = ({ url, mime, onLoadDuration, size }) => {
  const handleTimeUpdate = e => {
    if (e.target.currentTime > 0) {
      const video = e.target;
      const canvas = document.createElement('canvas');

      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      video.replaceWith(canvas);
      onLoadDuration(video.duration);
    }
  };

  const handleThumbnailVisibility = e => {
    const video = e.target;

    if (video.readyState < HAVE_FUTURE_DATA) return;

    video.play();
  };

  return (
    <VideoPreviewWrapper size={size}>
      <video
        muted
        onLoadedData={handleThumbnailVisibility}
        src={`${url}#t=1`}
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
      >
        <source type={mime} />
      </video>
    </VideoPreviewWrapper>
  );
};

VideoPreview.defaultProps = {
  size: 'M',
};

VideoPreview.propTypes = {
  url: PropTypes.string.isRequired,
  mime: PropTypes.string.isRequired,
  onLoadDuration: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['S', 'M']),
};
