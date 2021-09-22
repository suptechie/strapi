import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Row, Text, Box } from '@strapi/parts';
import { Expand } from '@strapi/icons';
import { ExpandButton } from './WysiwygStyles';

const WysiwygFooter = ({ isPreviewMode, onToggleExpand }) => {
  const { formatMessage } = useIntl();

  return (
    <Box padding={2} background="neutral100" hasRadius>
      <Row justifyContent="flex-end" alignItems="flex-end">
        <ExpandButton id="expand" disabled={isPreviewMode} onClick={onToggleExpand}>
          <Text>
            {formatMessage({
              id: 'components.WysiwygBottomControls.fullscreen',
              defaultMessage: 'Expand',
            })}
          </Text>
          <Expand />
        </ExpandButton>
      </Row>
    </Box>
  );
};

WysiwygFooter.defaultProps = {
  onToggleExpand: () => {},
  isPreviewMode: false,
};

WysiwygFooter.propTypes = {
  onToggleExpand: PropTypes.func,
  isPreviewMode: PropTypes.bool,
};

export default WysiwygFooter;
