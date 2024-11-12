/* eslint-disable jsx-a11y/media-has-caption */
import * as React from 'react';

import { Flex } from '@strapi/design-system';
import { File, FilePdf } from '@strapi/icons';
import { styled } from 'styled-components';

import { AssetType } from '../../../constants';
import { usePersistentState } from '../../../hooks/usePersistentState';

const CardAsset = styled(Flex)`
  border-radius: ${({ theme }) => theme.borderRadius} ${({ theme }) => theme.borderRadius} 0 0;
  background: linear-gradient(180deg, #ffffff 0%, #f6f6f9 121.48%);
`;

interface AssetPreviewProps {
  mime: string;
  name: string;
  url: string;
  onLoad?: () => void;
}

export const AssetPreview = React.forwardRef<
  HTMLImageElement | HTMLVideoElement | HTMLAudioElement,
  AssetPreviewProps
>(({ mime, url, name, ...props }, ref) => {
  const [lang] = usePersistentState('strapi-admin-language', 'en');

  if (mime.includes(AssetType.Image)) {
    return (
      <img ref={ref as React.ForwardedRef<HTMLImageElement>} src={url} alt={name} {...props} />
    );
  }

  if (mime.includes(AssetType.Video)) {
    return (
      <video controls src={url} ref={ref as React.ForwardedRef<HTMLVideoElement>} {...props}>
        <track label={name} default kind="captions" srcLang={lang} src="" />
      </video>
    );
  }

  if (mime.includes(AssetType.Audio)) {
    return (
      <audio controls src={url} ref={ref as React.ForwardedRef<HTMLAudioElement>} {...props}>
        {name}
      </audio>
    );
  }

  if (mime.includes('pdf')) {
    return (
      <CardAsset justifyContent="center" {...props}>
        <FilePdf aria-label={name} />
      </CardAsset>
    );
  }

  return (
    <CardAsset justifyContent="center" {...props}>
      <File aria-label={name} />
    </CardAsset>
  );
});

AssetPreview.displayName = 'AssetPreview';
