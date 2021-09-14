/* eslint-disable jsx-a11y/media-has-caption */
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const VideoPreviewWrapper = styled.div`
  canvas {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
`;

export const VideoPreview = ({ url, mime, onLoadDuration }) => {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleThumbnailVisibility = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    canvas.getContext('2d').drawImage(video, 0, 0);

    onLoadDuration(video.duration);
    setLoaded(true);
  };

  return (
    <VideoPreviewWrapper>
      {!loaded && (
        <video
          ref={videoRef}
          onLoadedData={handleThumbnailVisibility}
          src={`http://localhost:1337${url}`}
        >
          <source type={mime} />
        </video>
      )}

      <canvas ref={canvasRef} />
    </VideoPreviewWrapper>
  );
};

VideoPreview.propTypes = {
  url: PropTypes.string.isRequired,
  mime: PropTypes.string.isRequired,
  onLoadDuration: PropTypes.func.isRequired,
};
