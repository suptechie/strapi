import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Card,
  CardBody,
  CardContent,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardBadge,
} from '@strapi/design-system/Card';
import { Typography } from '@strapi/design-system/Typography';
import { Stack } from '@strapi/design-system/Stack';
import { useIntl } from 'react-intl';
import { getTrad } from '../../utils';
import { AssetType } from '../../constants';
import { useUpload } from '../../hooks/useUpload';
import { UploadProgress } from '../UploadProgress';

const UploadProgressWrapper = styled.div`
  height: ${88 / 16}rem;
  width: 100%;
`;

const Extension = styled.span`
  text-transform: uppercase;
`;

export const UploadingAssetCard = ({
  name,
  extension,
  assetType,
  file,
  onCancel,
  onStatusChange,
  addUploadedFiles,
}) => {
  const { upload, cancel, error, progress, status } = useUpload();
  const { formatMessage } = useIntl();

  let badgeContent;

  if (assetType === AssetType.Image) {
    badgeContent = formatMessage({
      id: getTrad('settings.section.image.label'),
      defaultMessage: 'Image',
    });
  } else if (assetType === AssetType.Video) {
    badgeContent = formatMessage({
      id: getTrad('settings.section.video.label'),
      defaultMessage: 'Video',
    });
  } else {
    badgeContent = formatMessage({
      id: getTrad('settings.section.doc.label'),
      defaultMessage: 'Doc',
    });
  }

  useEffect(() => {
    const uploadFile = async () => {
      const files = await upload(file);

      if (addUploadedFiles) {
        addUploadedFiles(files);
      }
    };

    uploadFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onStatusChange(status);
  }, [status, onStatusChange]);

  const handleCancel = () => {
    cancel();
    onCancel(file);
  };

  return (
    <Stack size={1}>
      <Card borderColor={error ? 'danger600' : undefined}>
        <CardHeader>
          <UploadProgressWrapper>
            <UploadProgress error={error} onCancel={handleCancel} progress={progress} />
          </UploadProgressWrapper>
        </CardHeader>
        <CardBody>
          <CardContent>
            <CardTitle as="h2">{name}</CardTitle>
            <CardSubtitle>
              <Extension>{extension}</Extension>
            </CardSubtitle>
          </CardContent>
          <CardBadge>{badgeContent}</CardBadge>
        </CardBody>
      </Card>
      {error ? (
        <Typography variant="pi" fontWeight="bold" textColor="danger600">
          {error.message}
        </Typography>
      ) : (
        undefined
      )}
    </Stack>
  );
};

UploadingAssetCard.defaultProps = {
  addUploadedFiles: undefined,
};

UploadingAssetCard.propTypes = {
  addUploadedFiles: PropTypes.func,
  assetType: PropTypes.oneOf(Object.values(AssetType)).isRequired,
  extension: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  file: PropTypes.instanceOf(File).isRequired,
  onCancel: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};
