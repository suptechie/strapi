import { Row, Checkbox, Text } from '@strapi/parts';
import upperFirst from 'lodash/upperFirst';
import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { useIntl } from 'react-intl';
import CollapseLabel from '../CollapseLabel';
import { firstRowWidth } from '../Permissions/utils/constants';

const RowLabelWithCheckbox = ({
  children,
  isCollapsable,
  isActive,
  isFormDisabled,
  label,
  onChange,
  onClick,
  checkboxName,
  someChecked,
  value,
}) => {
  const { formatMessage } = useIntl();

  return (
    <Row alignItems="center" paddingLeft={6} style={{ width: firstRowWidth, flexShrink: 0 }}>
      <Checkbox
        name={checkboxName}
        aria-label={formatMessage(
          {
            id: `Settings.permissions.select-all-by-permission`,
            defaultMessage: 'Select all {label} permissions',
          },
          { label }
        )}
        disabled={isFormDisabled}
        // Keep same signature as packages/core/admin/admin/src/components/Roles/Permissions/index.js l.91
        onValueChange={value =>
          onChange({
            target: {
              name: checkboxName,
              value,
            },
          })}
        indeterminate={someChecked}
        value={value}
      />
      <CollapseLabel
        title={label}
        alignItems="center"
        isCollapsable={isCollapsable}
        {...(isCollapsable && {
          onClick,
          'aria-expanded': isActive,
          onKeyDown: ({ key }) => (key === 'Enter' || key === ' ') && onClick(),
          tabIndex: 0,
          role: 'button',
        })}
      >
        <Text ellipsis>{upperFirst(label)}</Text>
        {children}
      </CollapseLabel>
    </Row>
  );
};

RowLabelWithCheckbox.defaultProps = {
  children: null,
  checkboxName: '',
  onChange: () => {},
  value: false,
  someChecked: false,
  isCollapsable: false,
};

RowLabelWithCheckbox.propTypes = {
  checkboxName: PropTypes.string,
  children: PropTypes.node,
  label: PropTypes.string.isRequired,
  isCollapsable: PropTypes.bool,
  isFormDisabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func,
  onClick: PropTypes.func.isRequired,
  someChecked: PropTypes.bool,
  value: PropTypes.bool,
  isActive: PropTypes.bool.isRequired,
};

export default memo(RowLabelWithCheckbox);
