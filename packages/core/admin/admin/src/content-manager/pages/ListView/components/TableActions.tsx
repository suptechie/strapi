import * as React from 'react';

import { Button, Flex } from '@strapi/design-system';
import { LinkButton } from '@strapi/design-system/v2';
import { useNotification, useStrapiApp, useQueryParams } from '@strapi/helper-plugin';
import { Duplicate, Pencil } from '@strapi/icons';
import { Contracts } from '@strapi/plugin-content-manager/_internal/shared';
import { stringify } from 'qs';
import { useIntl } from 'react-intl';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { DescriptionComponentRenderer } from '../../../../components/DescriptionComponentRenderer';
import { isBaseQueryError } from '../../../../utils/baseQuery';
import { useDocumentRBAC } from '../../../features/DocumentRBAC';
import { Document, useDoc } from '../../../hooks/useDocument';
import { useDocumentActions } from '../../../hooks/useDocumentActions';
import { DocumentActionsMenu } from '../../EditView/components/DocumentActions';

import { AutoCloneFailureModalBody } from './AutoCloneFailureModal';

import type {
  ContentManagerPlugin,
  DocumentActionComponent,
  DocumentActionProps,
} from '../../../../core/apis/content-manager';

/* -------------------------------------------------------------------------------------------------
 * TableActions
 * -----------------------------------------------------------------------------------------------*/

interface TableActionsProps {
  document: Document;
}

const TableActions = ({ document }: TableActionsProps) => {
  const { formatMessage } = useIntl();
  const { model, collectionType } = useDoc();
  const { plugins } = useStrapiApp();

  const props: DocumentActionProps = {
    activeTab: null,
    model,
    documentId: document.documentId,
    collectionType,
    document,
  };

  return (
    <DescriptionComponentRenderer
      props={props}
      descriptions={(
        plugins['content-manager'].apis as ContentManagerPlugin['config']['apis']
      ).getDocumentActions()}
    >
      {(actions) => {
        const tableRowActions = actions.filter((action) => {
          const positions = Array.isArray(action.position) ? action.position : [action.position];
          return positions.includes('table-row');
        });

        return (
          <DocumentActionsMenu
            actions={tableRowActions}
            label={formatMessage({
              id: 'content-manager.containers.list.table.row-actions',
              defaultMessage: 'Row action',
            })}
            variant="ghost"
          />
        );
      }}
    </DescriptionComponentRenderer>
  );
};

/* -------------------------------------------------------------------------------------------------
 * TableActionComponents
 * -----------------------------------------------------------------------------------------------*/

const EditAction: DocumentActionComponent = ({ documentId }) => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { canRead } = useDocumentRBAC('EditAction', ({ canRead }) => ({ canRead }));
  const toggleNotification = useNotification();
  const [{ query }] = useQueryParams<{ plugins?: object }>();

  return {
    disabled: !canRead,
    icon: <StyledPencil />,
    label: formatMessage({
      id: 'content-manager.actions.edit.label',
      defaultMessage: 'Edit',
    }),
    position: 'table-row',
    onClick: async () => {
      if (!documentId) {
        console.error(
          "You're trying to edit a document without an id, this is likely a bug with Strapi. Please open an issue."
        );

        toggleNotification({
          message: formatMessage({
            id: 'content-manager.actions.edit.error',
            defaultMessage: 'An error occurred while trying to edit the document.',
          }),
          type: 'warning',
        });

        return;
      }

      navigate({
        pathname: documentId,
        search: stringify({
          plugins: query.plugins,
        }),
      });
    },
  };
};

EditAction.type = 'edit';

/**
 * Because the icon system is completely broken, we have to do
 * this to remove the fill from the cog.
 */
const StyledPencil = styled(Pencil)`
  path {
    fill: currentColor;
  }
`;

const CloneAction: DocumentActionComponent = ({ model, documentId }) => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { canCreate } = useDocumentRBAC('CloneAction', ({ canCreate }) => ({ canCreate }));
  const toggleNotification = useNotification();
  const { autoClone } = useDocumentActions();
  const [prohibitedFields, setProhibitedFields] = React.useState<
    Contracts.CollectionTypes.ProhibitedCloningField[]
  >([]);

  return {
    disabled: !canCreate,
    icon: <StyledDuplicate />,
    label: formatMessage({
      id: 'content-manager.actions.clone.label',
      defaultMessage: 'Duplicate',
    }),
    position: 'table-row',
    onClick: async () => {
      if (!documentId) {
        console.error(
          "You're trying to clone a document in the table without an id, this is likely a bug with Strapi. Please open an issue."
        );

        toggleNotification({
          message: formatMessage({
            id: 'content-manager.actions.clone.error',
            defaultMessage: 'An error occurred while trying to clone the document.',
          }),
          type: 'warning',
        });

        return;
      }

      const res = await autoClone({ model, sourceId: documentId });

      if ('data' in res) {
        navigate(res.data.documentId);

        /**
         * We return true because we don't need to show a modal anymore.
         */
        return true;
      }

      if (
        isBaseQueryError(res.error) &&
        res.error.details &&
        typeof res.error.details === 'object' &&
        'prohibitedFields' in res.error.details &&
        Array.isArray(res.error.details.prohibitedFields)
      ) {
        const prohibitedFields = res.error.details
          .prohibitedFields as Contracts.CollectionTypes.ProhibitedCloningField[];

        setProhibitedFields(prohibitedFields);
      }
    },
    dialog: {
      type: 'modal',
      title: formatMessage({
        id: 'content-manager.containers.list.autoCloneModal.header',
        defaultMessage: 'Duplicate',
      }),
      content: <AutoCloneFailureModalBody prohibitedFields={prohibitedFields} />,
      footer: ({ onClose }) => {
        return (
          <Flex justifyContent="space-between">
            <Button onClick={onClose} variant="tertiary">
              {formatMessage({
                id: 'cancel',
                defaultMessage: 'Cancel',
              })}
            </Button>
            <LinkButton
              as={NavLink}
              // @ts-expect-error – the DS LinkButton can't infer props from the `as` prop component
              to={{
                pathname: `clone/${documentId}`,
              }}
            >
              {formatMessage({
                id: 'content-manager.containers.list.autoCloneModal.create',
                defaultMessage: 'Create',
              })}
            </LinkButton>
          </Flex>
        );
      },
    },
  };
};

CloneAction.type = 'clone';

/**
 * Because the icon system is completely broken, we have to do
 * this to remove the fill from the cog.
 */
const StyledDuplicate = styled(Duplicate)`
  path {
    fill: currentColor;
  }
`;

const DEFAULT_TABLE_ROW_ACTIONS = [EditAction, CloneAction];

export { TableActions, DEFAULT_TABLE_ROW_ACTIONS };
