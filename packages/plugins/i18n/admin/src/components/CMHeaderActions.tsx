import * as React from 'react';

import {
  useNotification,
  useQueryParams,
  Table,
  useAPIErrorHandler,
  FormErrors,
} from '@strapi/admin/strapi-admin';
import {
  type HeaderActionComponent,
  type DocumentActionComponent,
  unstable_useDocument as useDocument,
  unstable_useDocumentActions as useDocumentActions,
  buildValidParams,
} from '@strapi/content-manager/strapi-admin';
import { Flex, Status, Typography, Button } from '@strapi/design-system';
import { WarningCircle, ListPlus, Trash } from '@strapi/icons';
import { Modules } from '@strapi/types';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { styled } from 'styled-components';

import { useI18n } from '../hooks/useI18n';
import { useGetLocalesQuery } from '../services/locales';
import { useGetManyDraftRelationCountQuery } from '../services/relations';
import { getTranslation } from '../utils/getTranslation';
import { capitalize } from '../utils/strings';

import { BulkLocaleActionModal } from './BulkLocaleActionModal';

import type { Locale } from '../../../shared/contracts/locales';
import type { I18nBaseQuery } from '../types';

/* -------------------------------------------------------------------------------------------------
 * LocalePickerAction
 * -----------------------------------------------------------------------------------------------*/

const LocalePickerAction: HeaderActionComponent = ({
  document,
  meta,
  model,
  collectionType,
  documentId,
}) => {
  const { formatMessage } = useIntl();
  const [{ query }, setQuery] = useQueryParams<I18nBaseQuery>();
  const { hasI18n, canCreate, canRead } = useI18n();
  const { data: locales = [] } = useGetLocalesQuery();
  const { schema } = useDocument({ model, collectionType, documentId });

  const handleSelect = React.useCallback(
    (value: string) => {
      setQuery({
        plugins: {
          ...query.plugins,
          i18n: {
            locale: value,
          },
        },
      });
    },
    [query.plugins, setQuery]
  );

  React.useEffect(() => {
    if (!Array.isArray(locales) || !hasI18n) {
      return;
    }
    /**
     * Handle the case where the current locale query param doesn't exist
     * in the list of available locales, so we redirect to the default locale.
     */
    const currentDesiredLocale = query.plugins?.i18n?.locale;
    const doesLocaleExist = locales.find((loc) => loc.code === currentDesiredLocale);
    const defaultLocale = locales.find((locale) => locale.isDefault);
    if (!doesLocaleExist && defaultLocale?.code) {
      handleSelect(defaultLocale.code);
    }
  }, [handleSelect, hasI18n, locales, query.plugins?.i18n?.locale]);

  if (!hasI18n || !Array.isArray(locales) || locales.length === 0) {
    return null;
  }

  const currentLocale = query.plugins?.i18n?.locale || locales.find((loc) => loc.isDefault)?.code;

  const allCurrentLocales = [
    { status: getDocumentStatus(document, meta), locale: currentLocale },
    ...(meta?.availableLocales ?? []),
  ];

  return {
    label: formatMessage({
      id: getTranslation('Settings.locales.modal.locales.label'),
      defaultMessage: 'Locales',
    }),
    options: locales.map((locale) => {
      const currentLocaleDoc = allCurrentLocales.find((doc) =>
        'locale' in doc ? doc.locale === locale.code : false
      );
      const status = currentLocaleDoc?.status ?? 'draft';

      const permissionsToCheck = currentLocaleDoc ? canCreate : canRead;

      const statusVariant =
        status === 'draft' ? 'primary' : status === 'published' ? 'success' : 'alternative';

      return {
        disabled: !permissionsToCheck.includes(locale.code),
        value: locale.code,
        label: locale.name,
        startIcon: schema?.options?.draftAndPublish ? (
          <Status
            display="flex"
            paddingLeft="6px"
            paddingRight="6px"
            paddingTop="2px"
            paddingBottom="2px"
            showBullet={false}
            size={'S'}
            variant={statusVariant}
          >
            <Typography tag="span" variant="pi" fontWeight="bold">
              {capitalize(status)}
            </Typography>
          </Status>
        ) : null,
      };
    }),
    onSelect: handleSelect,
    value: currentLocale,
  };
};

type UseDocument = typeof useDocument;

const getDocumentStatus = (
  document: ReturnType<UseDocument>['document'],
  meta: ReturnType<UseDocument>['meta']
): 'draft' | 'published' | 'modified' => {
  const docStatus = document?.status;
  const statuses = meta?.availableStatus ?? [];

  /**
   * Creating an entry
   */
  if (!docStatus) {
    return 'draft';
  }

  /**
   * We're viewing a draft, but the document could have a published version
   */
  if (docStatus === 'draft' && statuses.find((doc) => doc.publishedAt !== null)) {
    return 'published';
  }

  return docStatus;
};

/* -------------------------------------------------------------------------------------------------
 * DeleteLocaleAction
 * -----------------------------------------------------------------------------------------------*/

const DeleteLocaleAction: DocumentActionComponent = ({
  document,
  documentId,
  model,
  collectionType,
}) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { toggleNotification } = useNotification();
  const { delete: deleteAction } = useDocumentActions();
  const { hasI18n, canDelete } = useI18n();

  if (!hasI18n) {
    return null;
  }

  return {
    disabled:
      (document?.locale && !canDelete.includes(document.locale)) || !document || !document.id,
    position: ['header', 'table-row'],
    label: formatMessage({
      id: getTranslation('actions.delete.label'),
      defaultMessage: 'Delete locale',
    }),
    icon: <StyledTrash />,
    variant: 'danger',
    dialog: {
      type: 'dialog',
      title: formatMessage({
        id: getTranslation('actions.delete.dialog.title'),
        defaultMessage: 'Confirmation',
      }),
      content: (
        <Flex direction="column" gap={2}>
          <WarningCircle width="24px" height="24px" fill="danger600" />
          <Typography tag="p" variant="omega" textAlign="center">
            {formatMessage({
              id: getTranslation('actions.delete.dialog.body'),
              defaultMessage: 'Are you sure?',
            })}
          </Typography>
        </Flex>
      ),
      onConfirm: async () => {
        if (!documentId || !document?.locale) {
          console.error(
            "You're trying to delete a document without an id or locale, this is likely a bug with Strapi. Please open an issue."
          );

          toggleNotification({
            message: formatMessage({
              id: getTranslation('actions.delete.error'),
              defaultMessage: 'An error occurred while trying to delete the document locale.',
            }),
            type: 'danger',
          });

          return;
        }

        const res = await deleteAction({
          documentId,
          model,
          collectionType,
          params: { locale: document.locale },
        });

        if (!('error' in res)) {
          navigate({ pathname: `../${collectionType}/${model}` }, { replace: true });
        }
      },
    },
  };
};

/* -------------------------------------------------------------------------------------------------
 * BulkPublishAction
 * -----------------------------------------------------------------------------------------------*/

export type LocaleStatus = {
  locale: string;
  status: Modules.Documents.Params.PublicationStatus.Kind | 'modified';
};

const BulkLocalePublishAction: DocumentActionComponent = ({
  document: baseDocument,
  documentId,
  model,
  collectionType,
}) => {
  const baseLocale = baseDocument?.locale ?? null;

  const [{ query }] = useQueryParams<{ status: 'draft' | 'published' }>();

  const params = React.useMemo(() => buildValidParams(query), [query]);
  const isPublishedTab = query.status === 'published';

  const { formatMessage } = useIntl();
  const { hasI18n, canPublish } = useI18n();
  const { toggleNotification } = useNotification();
  const { _unstableFormatAPIError: formatAPIError } = useAPIErrorHandler();

  const [selectedRows, setSelectedRows] = React.useState<any[]>([]);
  const [isConfirmationOpen, setIsConfirmationOpen] = React.useState<boolean>(false);

  const { publishMany: publishManyAction } = useDocumentActions();
  const {
    document,
    meta: documentMeta,
    schema,
    validate,
  } = useDocument({
    model,
    collectionType,
    documentId,
    params: {
      locale: baseLocale,
    },
  });

  const { data: localesMetadata = [] } = useGetLocalesQuery();

  const headers = [
    {
      label: formatMessage({
        id: 'global.name',
        defaultMessage: 'Name',
      }),
      name: 'name',
    },
    {
      label: formatMessage({
        id: getTranslation('CMEditViewBulkLocale.status'),
        defaultMessage: 'Status',
      }),
      name: 'status',
    },
    {
      label: formatMessage({
        id: getTranslation('CMEditViewBulkLocale.publication-status'),
        defaultMessage: 'Publication Status',
      }),
      name: 'publication-status',
    },
  ];

  // Extract the rows for the bulk locale publish modal and any validation
  // errors per locale
  const [rows, validationErrors] = React.useMemo(() => {
    if (!document || !documentMeta?.availableLocales) {
      // If we don't have a document or available locales, we return empty rows
      // and no validation errors
      return [[], {}];
    }

    // Build the rows for the bulk locale publish modal by combining the current
    // document with all the available locales from the document meta
    const rowsFromMeta: LocaleStatus[] = documentMeta?.availableLocales.map((doc) => {
      const { locale, status } = doc;

      return { locale, status };
    });
    rowsFromMeta.unshift({
      locale: document.locale,
      status: document.status,
    });

    // Build the validation errors for each locale.
    const allDocuments = [document, ...(documentMeta?.availableLocales ?? [])];
    const errors = allDocuments.reduce<FormErrors>((errs, document) => {
      if (!document) {
        return errs;
      }

      // Validate each locale entry via the useDocument validate function and store any errors in a dictionary
      const validation = validate(document as Modules.Documents.AnyDocument);
      if (validation !== null) {
        errs[document.locale] = validation;
      }
      return errs;
    }, {});

    return [rowsFromMeta, errors];
  }, [document, documentMeta?.availableLocales, validate]);

  const localesToPublish = selectedRows.reduce((acc, selectedRow) => {
    if (
      selectedRow.status !== 'published' &&
      !Object.keys(validationErrors).includes(selectedRow.locale)
    ) {
      acc.push(selectedRow.locale);
    }
    return acc;
  }, []);

  const {
    data: draftRelationsCount = 0,
    isLoading: isDraftRelationsLoading,
    error: isDraftRelationsError,
  } = useGetManyDraftRelationCountQuery(
    {
      model,
      documentIds: [documentId!],
      locale: localesToPublish,
    },
    {
      skip: !documentId || localesToPublish.length === 0,
    }
  );

  React.useEffect(() => {
    if (isDraftRelationsError) {
      toggleNotification({
        type: 'danger',
        message: formatAPIError(isDraftRelationsError),
      });
    }
  }, [isDraftRelationsError, toggleNotification, formatAPIError]);

  if (!schema?.options?.draftAndPublish ?? false) {
    return null;
  }

  if (!hasI18n) {
    return null;
  }

  if (!documentId) {
    return null;
  }

  // This document action can be enabled given that draft and publish and i18n are
  // enabled and we can publish the current locale.

  const publish = async () => {
    await publishManyAction({
      model,
      documentIds: [documentId],
      params: {
        ...params,
        locale: localesToPublish,
      },
    });

    setSelectedRows([]);
  };

  const handleAction = async () => {
    if (draftRelationsCount > 0) {
      setIsConfirmationOpen(true);
    } else {
      await publish();
    }
  };

  const isUnpublish = document?.status === 'published';
  if (isUnpublish) {
    // TODO: For now we still proceed so we have the bulk locale publish action in all cases
    console.warn(['I18N'], 'Bulk locale unpublish modal not implemented');
  }

  if (isConfirmationOpen) {
    return {
      label: formatMessage({
        id: 'app.components.ConfirmDialog.title',
        defaultMessage: 'Confirmation',
      }),
      variant: 'danger',
      dialog: {
        onCancel: () => {
          setIsConfirmationOpen(false);
        },
        onConfirm: async () => {
          await publish();

          setIsConfirmationOpen(false);
        },
        type: 'dialog',
        title: formatMessage({
          id: getTranslation('actions.publish.dialog.title'),
          defaultMessage: 'Confirmation',
        }),
        content: (
          <Flex direction="column" alignItems="center" gap={2}>
            <WarningCircle width="2.4rem" height="2.4rem" fill="danger600" />
            <Typography textAlign="center">
              {formatMessage({
                id: 'content-manager.actions.discard.dialog.body',
                defaultMessage:
                  'Are you sure you want to discard the changes? This action is irreversible.',
              })}
            </Typography>
          </Flex>
        ),
      },
    };
  }

  return {
    label: formatMessage({
      id: getTranslation('CMEditViewBulkLocale.publish-title'),
      defaultMessage: 'Publish Multiple Locales',
    }),
    icon: <ListPlus />,
    disabled: isPublishedTab || !canPublish,
    position: ['panel'],
    variant: 'secondary',
    dialog: {
      type: 'modal',
      title: formatMessage({
        id: getTranslation('CMEditViewBulkLocale.publish-title'),
        defaultMessage: 'Publish Multiple Locales',
      }),
      content: () => {
        return (
          <Table.Root
            headers={headers}
            rows={rows.map((row) => ({
              ...row,
              id: row.locale,
            }))}
            selectedRows={selectedRows}
            onSelectedRowsChange={(tableSelectedRows) => setSelectedRows(tableSelectedRows)}
          >
            <BulkLocaleActionModal
              validationErrors={validationErrors}
              headers={headers}
              rows={rows}
              localesMetadata={localesMetadata as Locale[]}
            />
          </Table.Root>
        );
      },
      footer: () => (
        <Flex justifyContent="flex-end">
          <Button
            loading={isDraftRelationsLoading}
            disabled={localesToPublish.length === 0}
            variant="default"
            onClick={handleAction}
          >
            {formatMessage({
              id: 'app.utils.publish',
              defaultMessage: 'Publish',
            })}
          </Button>
        </Flex>
      ),
    },
  };
};

/**
 * Because the icon system is completely broken, we have to do
 * this to remove the fill from the cog.
 */
const StyledTrash = styled(Trash)`
  path {
    fill: currentColor;
  }
`;

export { BulkLocalePublishAction, DeleteLocaleAction, LocalePickerAction };
