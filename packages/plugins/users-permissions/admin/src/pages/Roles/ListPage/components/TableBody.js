import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Tbody, Text, Tr, Td, Row } from '@strapi/parts';
import { EditIcon, DeleteIcon } from '@strapi/icons';
import { CheckPermissions } from '@strapi/helper-plugin';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { getTrad } from '../../../../utils';
import pluginId from '../../../../pluginId';

const TableBody = ({
  sortedRoles,
  canDelete,
  permissions,
  setRoleToDelete,
  setShowConfirmDelete,
  showConfirmDelete,
}) => {
  const { formatMessage } = useIntl();
  const { push } = useHistory();

  const checkCanDeleteRole = useCallback(
    role => {
      return canDelete && !['public', 'authenticated'].includes(role.type);
    },
    [canDelete]
  );

  const handleClickDelete = id => {
    setRoleToDelete(id);
    setShowConfirmDelete(!showConfirmDelete);
  };

  const handleClickEdit = id => {
    push(`/settings/${pluginId}/roles/${id}`);
  };

  return (
    <Tbody>
      {sortedRoles?.map(role => (
        <Tr key={role.name}>
          <Td width="20%">
            <Text>{role.name}</Text>
          </Td>
          <Td width="50%">
            <Text>{role.description}</Text>
          </Td>
          <Td width="30%">
            <Text>
              {`${role.nb_users} ${formatMessage({
                id: getTrad('Roles.users'),
                defaultMessage: 'users',
              }).toLowerCase()}`}
            </Text>
          </Td>
          <Td>
            <Row>
              <CheckPermissions permissions={permissions.updateRole}>
                <IconButton
                  onClick={() => handleClickEdit(role.id)}
                  noBorder
                  icon={<EditIcon />}
                  label="Edit"
                />
              </CheckPermissions>
              {checkCanDeleteRole(role) && (
                <CheckPermissions permissions={permissions.deleteRole}>
                  <IconButton
                    onClick={() => handleClickDelete(role.id)}
                    noBorder
                    icon={<DeleteIcon />}
                    label="Delete"
                  />
                </CheckPermissions>
              )}
            </Row>
          </Td>
        </Tr>
      ))}
    </Tbody>
  );
};

export default TableBody;

TableBody.defaultProps = {
  canDelete: false,
  showConfirmDelete: false,
};

TableBody.propTypes = {
  permissions: PropTypes.object.isRequired,
  setRoleToDelete: PropTypes.func.isRequired,
  setShowConfirmDelete: PropTypes.func.isRequired,
  sortedRoles: PropTypes.array.isRequired,
  canDelete: PropTypes.bool,
  showConfirmDelete: PropTypes.bool,
};
