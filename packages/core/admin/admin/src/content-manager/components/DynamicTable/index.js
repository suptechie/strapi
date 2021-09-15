import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { DynamicTable as Table, useStrapiApp } from '@strapi/helper-plugin';
import isEmpty from 'lodash/isEmpty';
import { INJECT_COLUMN_IN_TABLE } from '../../../exposedHooks';
import { getTrad } from '../../utils';
import State from '../State';
import TableRows from './TableRows';
import ConfirmDialogDeleteAll from './ConfirmDialogDeleteAll';
import ConfirmDialogDelete from './ConfirmDialogDelete';

const DynamicTable = ({
  canCreate,
  canDelete,
  contentTypeName,
  isBulkable,
  isLoading,
  onConfirmDelete,
  onConfirmDeleteAll,
  layout,
  rows,
}) => {
  const { runHookWaterfall } = useStrapiApp();
  const hasDraftAndPublish = layout.contentType.options.draftAndPublish || false;
  const { formatMessage } = useIntl();

  const tableHeaders = useMemo(() => {
    const headers = runHookWaterfall(INJECT_COLUMN_IN_TABLE, {
      displayedHeaders: layout.contentType.layouts.list,
      layout,
    });

    if (!hasDraftAndPublish) {
      return headers.displayedHeaders;
    }

    return [
      ...headers.displayedHeaders,
      {
        key: '__published_at_temp_key__',
        name: 'published_at',
        fieldSchema: {
          type: 'custom',
        },
        metadatas: {
          label: formatMessage({ id: getTrad('containers.ListPage.table-headers.published_at') }),
          searchable: false,
          sortable: true,
        },
        cellFormatter: cellData => {
          const isPublished = !isEmpty(cellData.published_at);

          return <State isPublished={isPublished} />;
        },
      },
    ];
  }, [runHookWaterfall, layout, hasDraftAndPublish, formatMessage]);

  return (
    <Table
      components={{ ConfirmDialogDelete, ConfirmDialogDeleteAll }}
      contentType={contentTypeName}
      isLoading={isLoading}
      headers={tableHeaders}
      onConfirmDelete={onConfirmDelete}
      onConfirmDeleteAll={onConfirmDeleteAll}
      rows={rows}
      withBulkActions
      withMainAction={canDelete && isBulkable}
    >
      <TableRows
        canCreate={canCreate}
        canDelete={canDelete}
        headers={tableHeaders}
        rows={rows}
        withBulkActions
        withMainAction={canDelete && isBulkable}
      />
    </Table>
  );
};

DynamicTable.propTypes = {
  canCreate: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  contentTypeName: PropTypes.string.isRequired,
  isBulkable: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  layout: PropTypes.exact({
    components: PropTypes.object.isRequired,
    contentType: PropTypes.shape({
      attributes: PropTypes.object.isRequired,
      metadatas: PropTypes.object.isRequired,
      info: PropTypes.shape({ label: PropTypes.string.isRequired }).isRequired,
      layouts: PropTypes.shape({
        list: PropTypes.array.isRequired,
        editRelations: PropTypes.array,
      }).isRequired,
      options: PropTypes.object.isRequired,
      settings: PropTypes.object.isRequired,
    }).isRequired,
  }).isRequired,
  onConfirmDelete: PropTypes.func.isRequired,
  onConfirmDeleteAll: PropTypes.func.isRequired,
  rows: PropTypes.array.isRequired,
};

export default DynamicTable;
