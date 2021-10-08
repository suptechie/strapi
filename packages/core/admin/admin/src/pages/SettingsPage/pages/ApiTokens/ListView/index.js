import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
  SettingsPageTitle,
  useFocusWhenNavigate,
  useNotification,
  NoPermissions,
  useRBAC,
  NoContent,
  DynamicTable,
} from '@strapi/helper-plugin';
import { HeaderLayout, ContentLayout } from '@strapi/parts/Layout';
import { Main } from '@strapi/parts/Main';
import { Button } from '@strapi/parts/Button';
import { LinkButton } from '@strapi/parts/LinkButton';
import AddIcon from '@strapi/icons/AddIcon';
import { useQuery } from 'react-query';
import { useHistory } from 'react-router-dom';
import qs from 'qs';
import { axiosInstance } from '../../../../../core/utils';
import adminPermissions from '../../../../../permissions';
import tableHeaders from './utils/tableHeaders';
import TableRows from './DynamicTable';

const ApiTokenListView = () => {
  useFocusWhenNavigate();
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();
  const {
    allowedActions: { canCreate, canDelete, canUpdate, canRead },
  } = useRBAC(adminPermissions.settings['api-tokens']);
  const { push } = useHistory();

  useEffect(() => {
    push({ search: qs.stringify({ sort: 'name:ASC' }, { encode: false }) });
  }, [push]);

  const { data: apiTokens, status, isFetching } = useQuery(
    ['api-tokens'],
    async () => {
      const {
        data: { data },
      } = await axiosInstance.get(`/admin/api-tokens`);

      return data;
    },
    {
      enabled: canRead,
      onError: () => {
        toggleNotification({
          type: 'warning',
          message: { id: 'notification.error', defaultMessage: 'An error occured' },
        });
      },
    }
  );

  const isLoading =
    canRead &&
    ((status !== 'success' && status !== 'error') || (status === 'success' && isFetching));

  const shouldDisplayDynamicTable = canRead && apiTokens;
  const shouldDisplayNoContent = canRead && !apiTokens && !canCreate;
  const shouldDisplayNoContentWithCreationButton = canRead && !apiTokens && canCreate;

  return (
    <Main aria-busy={isLoading}>
      <SettingsPageTitle name="API Tokens" />
      <HeaderLayout
        title={formatMessage({ id: 'Settings.apiTokens.title', defaultMessage: 'API Tokens' })}
        subtitle={formatMessage({
          id: 'Settings.apiTokens.description',
          defaultMessage: 'List of generated tokens to consume the API',
        })}
        primaryAction={
          canCreate ? (
            <LinkButton
              data-testid="create-api-token-button"
              startIcon={<AddIcon />}
              size="L"
              to="/settings/api-tokens/create"
            >
              {formatMessage({
                id: 'Settings.apiTokens.create',
                defaultMessage: 'Add Entry',
              })}
            </LinkButton>
          ) : (
            undefined
          )
        }
      />
      <ContentLayout>
        {!canRead && <NoPermissions />}
        {shouldDisplayDynamicTable && (
          <DynamicTable
            headers={tableHeaders}
            contentType="api-tokens"
            rows={apiTokens}
            withBulkActions={canDelete || canUpdate}
            isLoading={isLoading}
          >
            <TableRows
              canDelete={canDelete}
              canUpdate={canUpdate}
              rows={apiTokens}
              withBulkActions={canDelete || canUpdate}
            />
          </DynamicTable>
        )}
        {shouldDisplayNoContentWithCreationButton && (
          <NoContent
            content={{
              id: 'Settings.apiTokens.addFirstToken',
              defaultMessage: 'Add your first API Token',
            }}
            action={
              <Button variant="secondary" startIcon={<AddIcon />}>
                {formatMessage({
                  id: 'Settings.apiTokens.addNewToken',
                  defaultMessage: 'Add new API Token',
                })}
              </Button>
            }
          />
        )}
        {shouldDisplayNoContent && (
          <NoContent
            content={{
              id: 'Settings.apiTokens.emptyStateLayout',
              defaultMessage: 'You don’t have any content yet...',
            }}
          />
        )}
      </ContentLayout>
    </Main>
  );
};

export default ApiTokenListView;
