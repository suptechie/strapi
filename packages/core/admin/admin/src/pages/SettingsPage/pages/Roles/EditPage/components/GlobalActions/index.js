import { BaseCheckbox, Stack, TableLabel, Box } from '@strapi/parts';
import IS_DISABLED from 'ee_else_ce/pages/SettingsPage/pages/Roles/EditPage/components/GlobalActions/utils/constants';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { memo, useMemo } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { usePermissionsDataManager } from '../../../../../../../hooks';
import { cellWidth, firstRowWidth } from '../Permissions/utils/constants';
import { findDisplayedActions, getCheckboxesState } from './utils';

const CenteredStack = styled(Stack)`
  align-items: center;
  justify-content: center;
  width: ${cellWidth};
  flex-shrink: 0;
`;

const GlobalActions = ({ actions, isFormDisabled, kind }) => {
  const { formatMessage } = useIntl();
  const { modifiedData, onChangeCollectionTypeGlobalActionCheckbox } = usePermissionsDataManager();

  const displayedActions = useMemo(() => {
    return findDisplayedActions(actions);
  }, [actions]);

  const checkboxesState = useMemo(() => {
    return getCheckboxesState(displayedActions, modifiedData[kind]);
  }, [modifiedData, displayedActions, kind]);

  return (
    <Box paddingBottom={4} paddingTop={6} style={{ paddingLeft: firstRowWidth }}>
      <Stack horizontal size={0}>
        {displayedActions.map(({ label, actionId }) => {
          return (
            <CenteredStack key={actionId} size={3}>
              <TableLabel textColor="neutral500">
                {formatMessage({
                  id: `Settings.roles.form.permissions.${label.toLowerCase()}`,
                  defaultMessage: label,
                })}
              </TableLabel>
              <BaseCheckbox
                disabled={isFormDisabled || IS_DISABLED}
                onValueChange={value => {
                  onChangeCollectionTypeGlobalActionCheckbox(kind, actionId, value);
                }}
                name={actionId}
                aria-label={formatMessage(
                  {
                    id: `Settings.permissions.select-all-by-permission`,
                    defaultMessage: 'Select all {label} permissions',
                  },
                  {
                    label: formatMessage({
                      id: `Settings.roles.form.permissions.${label.toLowerCase()}`,
                      defaultMessage: label,
                    }),
                  }
                )}
                value={get(checkboxesState, [actionId, 'hasAllActionsSelected'], false)}
                indeterminate={get(checkboxesState, [actionId, 'hasSomeActionsSelected'], false)}
              />
            </CenteredStack>
          );
        })}
      </Stack>
    </Box>
  );
};

GlobalActions.defaultProps = {
  actions: [],
};

GlobalActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      actionId: PropTypes.string.isRequired,
      subjects: PropTypes.array.isRequired,
    })
  ),
  isFormDisabled: PropTypes.bool.isRequired,
  kind: PropTypes.string.isRequired,
};

export default memo(GlobalActions);
