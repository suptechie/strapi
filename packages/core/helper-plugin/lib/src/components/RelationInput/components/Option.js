import React from 'react';
import styled from 'styled-components';
import { components } from 'react-select';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { get, has } from 'lodash';
import { Flex } from '@strapi/design-system/Flex';
import { Typography } from '@strapi/design-system/Typography';

import pxToRem from '../../../utils/pxToRem';

const StyledBullet = styled.div`
  flex-shrink: 0;
  width: ${pxToRem(6)};
  height: ${pxToRem(6)};
  margin-right: ${({ theme }) => theme.spaces[2]};
  background-color: ${({ theme, isDraft }) =>
    theme.colors[isDraft ? 'secondary600' : 'success600']};
  border-radius: 50%;
`;

export const Option = (props) => {
  console.log(props);
  const { formatMessage } = useIntl();
  const Component = components.Option;
  const hasDraftAndPublish = has(get(props, 'data'), 'isDraft');

  if (hasDraftAndPublish) {
    // To fix: use getTrad utils from CM once component is migrated into CM components
    const draftMessage = {
      id: 'content-manager.components.Select.draft-info-title',
      defaultMessage: 'State: Draft',
    };
    // To fix: use getTrad utils from CM once component is migrated into CM components
    const publishedMessage = {
      id: 'content-manager.components.Select.publish-info-title',
      defaultMessage: 'State: Published',
    };
    const { isDraft } = props.data;
    const title = isDraft ? formatMessage(draftMessage) : formatMessage(publishedMessage);

    return (
      <Component {...props}>
        <Flex>
          <StyledBullet title={title} isDraft={isDraft} />
          <Typography ellipsis>{props.data.mainField || '-'}</Typography>
        </Flex>
      </Component>
    );
  }

  return <Component {...props}>{props.data.mainField || '-'}</Component>;
};

Option.propTypes = {
  isFocused: PropTypes.bool.isRequired,
  data: PropTypes.shape({
    isDraft: PropTypes.bool,
    mainField: PropTypes.string,
  }).isRequired,
};
