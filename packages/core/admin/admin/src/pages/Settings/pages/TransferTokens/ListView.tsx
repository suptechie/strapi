import * as React from 'react';

import { ContentLayout, EmptyStateLayout, HeaderLayout, LinkButton } from '@strapi/design-system';
import { EmptyDocuments, Plus } from '@strapi/icons';
import { Entity } from '@strapi/types';
import * as qs from 'qs';
import { Helmet } from 'react-helmet';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { Page } from '../../../../components/PageHelpers';
import { useTypedSelector } from '../../../../core/store/hooks';
import { useNotification } from '../../../../features/Notifications';
import { useTracking } from '../../../../features/Tracking';
import { useAPIErrorHandler } from '../../../../hooks/useAPIErrorHandler';
import { useOnce } from '../../../../hooks/useOnce';
import { useRBAC } from '../../../../hooks/useRBAC';
import {
  useDeleteTransferTokenMutation,
  useGetTransferTokensQuery,
} from '../../../../services/transferTokens';
import { TRANSFER_TOKEN_TYPE } from '../../components/Tokens/constants';
import { Table } from '../../components/Tokens/Table';

const tableHeaders = [
  {
    name: 'name',
    label: {
      id: 'Settings.tokens.ListView.headers.name',
      defaultMessage: 'Name',
    },
    sortable: true,
  },
  {
    name: 'description',
    label: {
      id: 'Settings.tokens.ListView.headers.description',
      defaultMessage: 'Description',
    },
    sortable: false,
  },
  {
    name: 'createdAt',
    label: {
      id: 'Settings.tokens.ListView.headers.createdAt',
      defaultMessage: 'Created at',
    },
    sortable: false,
  },
  {
    name: 'lastUsedAt',
    label: {
      id: 'Settings.tokens.ListView.headers.lastUsedAt',
      defaultMessage: 'Last used',
    },
    sortable: false,
  },
] as const;

/* -------------------------------------------------------------------------------------------------
 * ListView
 * -----------------------------------------------------------------------------------------------*/

const ListView = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const permissions = useTypedSelector(
    (state) => state.admin_app.permissions.settings?.['transfer-tokens']
  );
  const {
    isLoading: isLoadingRBAC,
    allowedActions: { canCreate, canDelete, canUpdate, canRead },
  } = useRBAC(permissions);
  const navigate = useNavigate();
  const { trackUsage } = useTracking();
  const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();

  React.useEffect(() => {
    navigate({ search: qs.stringify({ sort: 'name:ASC' }, { encode: false }) });
  }, [navigate]);

  useOnce(() => {
    trackUsage('willAccessTokenList', {
      tokenType: TRANSFER_TOKEN_TYPE,
    });
  });

  const headers = tableHeaders.map((header) => ({
    ...header,
    label: formatMessage(header.label),
  }));

  const {
    data: transferTokens = [],
    isLoading: isLoadingTokens,
    error,
  } = useGetTransferTokensQuery(undefined, {
    skip: !canRead,
  });

  React.useEffect(() => {
    if (transferTokens) {
      trackUsage('didAccessTokenList', {
        number: transferTokens.length,
        tokenType: TRANSFER_TOKEN_TYPE,
      });
    }
  }, [trackUsage, transferTokens]);

  React.useEffect(() => {
    if (error) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(error),
      });
    }
  }, [error, formatAPIError, toggleNotification]);

  const [deleteToken] = useDeleteTransferTokenMutation();

  const handleDelete = async (id: Entity.ID) => {
    try {
      const res = await deleteToken(id);

      if ('error' in res) {
        toggleNotification({
          type: 'danger',
          message: formatAPIError(res.error),
        });
      }
    } catch {
      toggleNotification({
        type: 'danger',
        message: formatMessage({ id: 'notification.error', defaultMessage: 'An error occured' }),
      });
    }
  };

  const isLoading = isLoadingTokens || isLoadingRBAC;

  return (
    <>
      <Helmet
        title={formatMessage(
          { id: 'Settings.PageTitle', defaultMessage: 'Settings - {name}' },
          {
            name: 'Transfer Tokens',
          }
        )}
      />
      <HeaderLayout
        title={formatMessage({
          id: 'Settings.transferTokens.title',
          defaultMessage: 'Transfer Tokens',
        })}
        subtitle={formatMessage({
          id: 'Settings.transferTokens.description',
          defaultMessage: '"List of generated transfer tokens"', // TODO change this message
        })}
        primaryAction={
          canCreate ? (
            <LinkButton
              data-testid="create-transfer-token-button"
              startIcon={<Plus />}
              size="S"
              onClick={() =>
                trackUsage('willAddTokenFromList', {
                  tokenType: TRANSFER_TOKEN_TYPE,
                })
              }
              to="/settings/transfer-tokens/create"
            >
              {formatMessage({
                id: 'Settings.transferTokens.create',
                defaultMessage: 'Create new Transfer Token',
              })}
            </LinkButton>
          ) : undefined
        }
      />
      {!canRead ? (
        <Page.NoPermissions />
      ) : (
        <Page.Main aria-busy={isLoading}>
          <ContentLayout>
            {transferTokens.length > 0 && (
              <Table
                permissions={{ canRead, canDelete, canUpdate }}
                headers={headers}
                isLoading={isLoading}
                onConfirmDelete={handleDelete}
                tokens={transferTokens}
                tokenType={TRANSFER_TOKEN_TYPE}
              />
            )}
            {canCreate && transferTokens.length === 0 ? (
              <EmptyStateLayout
                action={
                  <LinkButton
                    variant="secondary"
                    startIcon={<Plus />}
                    to="/settings/transfer-tokens/create"
                  >
                    {formatMessage({
                      id: 'Settings.transferTokens.addNewToken',
                      defaultMessage: 'Add new Transfer Token',
                    })}
                  </LinkButton>
                }
                icon={<EmptyDocuments width="10rem" />}
                content={formatMessage({
                  id: 'Settings.transferTokens.addFirstToken',
                  defaultMessage: 'Add your first Transfer Token',
                })}
              />
            ) : null}
            {!canCreate && transferTokens.length === 0 ? (
              <EmptyStateLayout
                icon={<EmptyDocuments width="10rem" />}
                content={formatMessage({
                  id: 'Settings.transferTokens.emptyStateLayout',
                  defaultMessage: 'You don’t have any content yet...',
                })}
              />
            ) : null}
          </ContentLayout>
        </Page.Main>
      )}
    </>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ProtectedListView
 * -----------------------------------------------------------------------------------------------*/

const ProtectedListView = () => {
  const permissions = useTypedSelector(
    (state) => state.admin_app.permissions.settings?.['transfer-tokens'].main
  );

  return (
    <Page.Protect permissions={permissions}>
      <ListView />
    </Page.Protect>
  );
};

export { ListView, ProtectedListView };
