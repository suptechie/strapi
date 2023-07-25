import React from 'react';
import PropTypes from 'prop-types';
import { Combobox, ComboboxOption } from '@strapi/design-system';
import { getDisplayName } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';

import { useAdminUsers } from '../../../hooks/useAdminUsers';

const AdminUsersFilter = ({ value, onChange }) => {
  const { formatMessage } = useIntl();
  const { users, isLoading } = useAdminUsers({}, { staleTime: 2 * (1000 * 60) });
  const ariaLabel = formatMessage({
    id: 'content-manager.components.Filters.usersSelect.label',
    defaultMessage: 'Search and select an user to filter',
  });

  return (
    <Combobox value={value} aria-label={ariaLabel} onChange={onChange} loading={isLoading}>
      {users.map((user) => {
        return (
          <ComboboxOption key={user.id} value={user.id.toString()}>
            {getDisplayName(user, formatMessage)}
          </ComboboxOption>
        );
      })}
    </Combobox>
  );
};

AdminUsersFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

AdminUsersFilter.defaultProps = {
  value: '',
};

export { AdminUsersFilter };