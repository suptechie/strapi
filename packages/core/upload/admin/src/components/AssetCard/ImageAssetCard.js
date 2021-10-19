import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Card,
  CardAction,
  CardAsset,
  CardBadge,
  CardBody,
  CardCheckbox,
  CardContent,
  CardHeader,
  CardTitle,
  CardSubtitle,
} from '@strapi/parts/Card';
import { IconButton } from '@strapi/parts/IconButton';
import EditIcon from '@strapi/icons/EditIcon';
import { useIntl } from 'react-intl';
import { getTrad } from '../../utils';

const Extension = styled.span`
  text-transform: uppercase;
`;

export const ImageAssetCard = ({
  name,
  extension,
  height,
  width,
  thumbnail,
  selected,
  onSelect,
  onEdit,
  size,
}) => {
  const { formatMessage } = useIntl();

  // Prevents the browser from caching the URL for all sizes and allow react-query to make a smooth update
  // instead of a full refresh
  const optimizedCachingThumbnail =
    width && height ? `${thumbnail}?width=${width}&height=${height}` : thumbnail;

  return (
    <Card>
      <CardHeader>
        {onSelect && <CardCheckbox value={selected} onValueChange={onSelect} />}
        {onEdit && (
          <CardAction position="end">
            <IconButton
              label={formatMessage({ id: getTrad('control-card.edit'), defaultMessage: 'Edit' })}
              icon={<EditIcon />}
              onClick={onEdit}
            />
          </CardAction>
        )}
        <CardAsset src={optimizedCachingThumbnail} size={size} />
      </CardHeader>
      <CardBody>
        <CardContent>
          <CardTitle as="h2">{name}</CardTitle>
          <CardSubtitle>
            <Extension>{extension}</Extension>
            {height && width && `- ${height}✕${width}`}
          </CardSubtitle>
        </CardContent>
        <CardBadge>
          {formatMessage({ id: getTrad('settings.section.image.label'), defaultMessage: 'Image' })}
        </CardBadge>
      </CardBody>
    </Card>
  );
};

ImageAssetCard.defaultProps = {
  height: undefined,
  width: undefined,
  selected: false,
  onEdit: undefined,
  onSelect: undefined,
  size: 'M',
};

ImageAssetCard.propTypes = {
  extension: PropTypes.string.isRequired,
  height: PropTypes.number,
  name: PropTypes.string.isRequired,
  onEdit: PropTypes.func,
  onSelect: PropTypes.func,
  width: PropTypes.number,
  thumbnail: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  size: PropTypes.oneOf(['S', 'M']),
};
