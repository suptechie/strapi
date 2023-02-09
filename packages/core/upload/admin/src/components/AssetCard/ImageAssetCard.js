import React from 'react';
import PropTypes from 'prop-types';
import { CardAsset } from '@strapi/design-system/Card';

import { AssetCardBase } from './AssetCardBase';

export const ImageAssetCard = ({ height, width, thumbnail, size, alt, ...props }) => {
  // Prevents the browser from caching the URL for all sizes and allow react-query to make a smooth update
  // instead of a full refresh
  const optimizedCachingThumbnail = new URL(thumbnail);
  // TODO: This gives problems with presigned URLs
  // optimizedCachingThumbnail.searchParams.set('width', width);
  // optimizedCachingThumbnail.searchParams.set('height', height);

  return (
    <AssetCardBase {...props} subtitle={height && width && ` - ${width}✕${height}`} variant="Image">
      <CardAsset src={optimizedCachingThumbnail.toString()} size={size} alt={alt} />
    </AssetCardBase>
  );
};

ImageAssetCard.defaultProps = {
  height: undefined,
  width: undefined,
  selected: false,
  onEdit: undefined,
  onSelect: undefined,
  onRemove: undefined,
  size: 'M',
};

ImageAssetCard.propTypes = {
  alt: PropTypes.string.isRequired,
  extension: PropTypes.string.isRequired,
  height: PropTypes.number,
  name: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
  onSelect: PropTypes.func,
  onRemove: PropTypes.func,
  width: PropTypes.number,
  thumbnail: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  size: PropTypes.oneOf(['S', 'M']),
};
