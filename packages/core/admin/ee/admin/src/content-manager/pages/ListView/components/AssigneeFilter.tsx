import * as React from 'react';

import { Combobox, ComboboxOption, ComboboxProps } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { Filters } from '../../../../../../../admin/src/components/Filters';
import { useField } from '../../../../../../../admin/src/components/Form';
import { getDisplayName } from '../../../../../../../admin/src/content-manager/utils/users';
import { useAdminUsers } from '../../../../../../../admin/src/services/users';

interface AssigneeFilterProps extends Pick<ComboboxProps, 'value' | 'onChange'> {}

const AssigneeFilter = ({ name }: Filters.ValueInputProps) => {
  const [page, setPage] = React.useState(1);
  const { formatMessage } = useIntl();
  const { data, isLoading } = useAdminUsers({
    page,
  });
  const users = data?.users || [];

  const field = useField(name);

  const handleChange = (value?: string) => {
    setPage(1);
    field.onChange(name, value);
  };

  return (
    <Combobox
      value={field.value}
      aria-label={formatMessage({
        id: 'content-manager.components.Filters.usersSelect.label',
        defaultMessage: 'Search and select an user to filter',
      })}
      onChange={handleChange}
      loading={isLoading}
      onLoadMore={() => setPage((prev) => prev + 1)}
    >
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

export { AssigneeFilter };
export type { AssigneeFilterProps };
