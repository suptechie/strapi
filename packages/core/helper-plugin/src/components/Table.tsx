import * as React from 'react';

import {
  Box,
  Flex,
  Button,
  Typography,
  Th,
  Tbody,
  Td,
  Tooltip,
  IconButton,
  Thead,
  Tr,
  BaseCheckbox,
  VisuallyHidden,
  Loader,
  Table as DSTable,
  TableProps as DSTableProps,
  EmptyStateLayout,
  EmptyStateLayoutProps,
} from '@strapi/design-system';
import { CarretDown, EmptyDocuments, Trash } from '@strapi/icons';
import { MessageDescriptor, useIntl } from 'react-intl';
import styled from 'styled-components';

import { useQueryParams } from '../hooks/useQueryParams';

import { ConfirmDialog } from './ConfirmDialog';

import type { Attribute, Documents, Entity } from '@strapi/types';

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/

interface TableContextValue<
  TRow extends { documentId: Documents.ID; id: number } | { id: Entity.ID } = { id: Entity.ID }
> {
  selectedEntries: Entity.ID[];
  setSelectedEntries: React.Dispatch<React.SetStateAction<Entity.ID[]>>;
  onSelectRow: (args: { name: Entity.ID; value: boolean }) => void;
  rows: TRow[];
  isLoading: boolean;
  isFetching: boolean;
  colCount: number;
  rowCount: number;
}

const TableContext = React.createContext<TableContextValue | null>(null);

const useTableContext = <TRow extends { id: Entity.ID }>() => {
  const context = React.useContext(TableContext);

  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }

  return context as TableContextValue<TRow>;
};

/* -------------------------------------------------------------------------------------------------
 * ActionBar
 * -----------------------------------------------------------------------------------------------*/

interface ActionBarProps {
  children?: React.ReactNode;
}

const ActionBar = ({ children }: ActionBarProps) => {
  const { formatMessage } = useIntl();
  const { selectedEntries } = useTableContext();

  if (selectedEntries.length === 0) return null;

  return (
    <Flex gap={2}>
      <Typography variant="omega" textColor="neutral500">
        {formatMessage(
          {
            id: 'content-manager.components.TableDelete.label',
            defaultMessage: '{number, plural, one {# entry} other {# entries}} selected',
          },
          { number: selectedEntries.length }
        )}
      </Typography>
      {children}
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * BulkDeleteButton
 * -----------------------------------------------------------------------------------------------*/

interface BulkDeleteButtonProps {
  onConfirmDeleteAll: (ids: Entity.ID[]) => Promise<void>;
}

const BulkDeleteButton = ({ onConfirmDeleteAll }: BulkDeleteButtonProps) => {
  const { selectedEntries, setSelectedEntries } = useTableContext();
  const { formatMessage } = useIntl();
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = React.useState(false);
  const [isConfirmButtonLoading, setIsConfirmButtonLoading] = React.useState(false);

  const handleConfirmDeleteAll = async () => {
    try {
      setIsConfirmButtonLoading(true);
      await onConfirmDeleteAll(selectedEntries);
      setIsConfirmButtonLoading(false);
      handleToggleConfirmDeleteAll();
      setSelectedEntries([]);
    } catch (err) {
      setIsConfirmButtonLoading(false);
      handleToggleConfirmDeleteAll();
    }
  };

  const handleToggleConfirmDeleteAll = () => {
    setShowConfirmDeleteAll((prev) => !prev);
  };

  return (
    <>
      <Button
        onClick={handleToggleConfirmDeleteAll}
        startIcon={<Trash />}
        size="L"
        variant="danger-light"
      >
        {formatMessage({ id: 'global.delete', defaultMessage: 'Delete' })}
      </Button>
      <ConfirmDialog
        isConfirmButtonLoading={isConfirmButtonLoading}
        onConfirm={handleConfirmDeleteAll}
        onToggleDialog={handleToggleConfirmDeleteAll}
        isOpen={showConfirmDeleteAll}
      />
    </>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Head
 * -----------------------------------------------------------------------------------------------*/

interface HeadProps {
  children: React.ReactNode;
}

const Head = ({ children }: HeadProps) => {
  return (
    <Thead>
      <Tr>{children}</Tr>
    </Thead>
  );
};

/* -------------------------------------------------------------------------------------------------
 * HeaderCheckboxCell
 * -----------------------------------------------------------------------------------------------*/

const HeaderCheckboxCell = () => {
  const { selectedEntries, setSelectedEntries, rows } = useTableContext();

  const { formatMessage } = useIntl();

  const areAllEntriesSelected = selectedEntries.length === rows.length && rows.length > 0;
  const isIndeterminate = !areAllEntriesSelected && selectedEntries.length > 0;

  const handleSelectAll = () => {
    if (!areAllEntriesSelected) {
      setSelectedEntries(rows.map((row) => row.id));
    } else {
      setSelectedEntries([]);
    }
  };

  if (rows.length === 0) {
    return null;
  }

  return (
    <Th>
      <BaseCheckbox
        aria-label={formatMessage({
          id: 'global.select-all-entries',
          defaultMessage: 'Select all entries',
        })}
        checked={areAllEntriesSelected}
        indeterminate={isIndeterminate}
        onChange={handleSelectAll}
      />
    </Th>
  );
};

/* -------------------------------------------------------------------------------------------------
 * HeaderHiddenActionsCell
 * -----------------------------------------------------------------------------------------------*/

const HeaderHiddenActionsCell = () => {
  const { formatMessage } = useIntl();

  return (
    <Th>
      <VisuallyHidden>
        {formatMessage({
          id: 'global.actions',
          defaultMessage: 'Actions',
        })}
      </VisuallyHidden>
    </Th>
  );
};

/* -------------------------------------------------------------------------------------------------
 * HeaderCell
 * -----------------------------------------------------------------------------------------------*/

/**
 * This is a straight up copy of the ListFieldLayout component from the
 * admin, when we deprecate the helper-plugin this will be tightened up.
 */
interface HeaderCellProps {
  /**
   * The attribute data from the content-type's schema for the field
   */
  attribute: Attribute.Any | { type: 'custom' };
  /**
   * Typically used by plugins to render a custom cell
   */
  cellFormatter?: (
    data: {
      [key: string]: any;
    },
    header: Omit<HeaderCellProps, 'cellFormatter'>,
    meta: { collectionType: string; model: string }
  ) => React.ReactNode;
  label: string | MessageDescriptor;
  /**
   * the name of the attribute we use to display the actual name e.g. relations
   * are just ids, so we use the mainField to display something meaninginful by
   * looking at the target's schema
   */
  mainField?: string;
  name: string;
  searchable?: boolean;
  sortable?: boolean;
}

const HeaderCell = ({ attribute, mainField, name, label, sortable }: HeaderCellProps) => {
  const [{ query }, setQuery] = useQueryParams<{ sort: `${string}:${'ASC' | 'DESC'}` }>();
  const sort = typeof query?.sort === 'string' ? query.sort : '';
  const [sortBy, sortOrder] = sort.split(':');
  const { formatMessage } = useIntl();

  let isSorted = sortBy === name;
  const isUp = sortOrder === 'ASC';

  // relations always have to be sorted by their main field instead of only the
  // attribute name; sortBy e.g. looks like: &sortBy=attributeName[mainField]:ASC
  if (attribute.type === 'relation' && mainField) {
    isSorted = sortBy === `${name.split('.')[0]}[${mainField}]`;
  }

  const cellLabel = typeof label === 'string' ? label : formatMessage(label);

  const sortLabel = formatMessage(
    { id: 'components.TableHeader.sort', defaultMessage: 'Sort on {label}' },
    { label: cellLabel }
  );

  const handleClickSort = (shouldAllowClick = true) => {
    if (sortable && shouldAllowClick) {
      let nextSort = name;

      // relations always have to be sorted by their main field instead of only the
      // attribute name; nextSort e.g. looks like: &nextSort=attributeName[mainField]:ASC
      if (attribute.type === 'relation' && mainField) {
        nextSort = `${name.split('.')[0]}[${mainField}]`;
      }

      setQuery({
        sort: `${nextSort}:${isSorted && sortOrder === 'ASC' ? 'DESC' : 'ASC'}`,
      });
    }
  };

  return (
    <Th
      key={name}
      action={
        isSorted &&
        sortable && (
          <IconButton
            label={sortLabel}
            onClick={() => handleClickSort(true)}
            icon={<SortIcon isUp={isUp} />}
            noBorder
          />
        )
      }
    >
      <Tooltip label={sortable ? sortLabel : cellLabel}>
        <Typography
          textColor="neutral600"
          as={!isSorted && sortable ? 'button' : 'span'}
          onClick={() => handleClickSort()}
          variant="sigma"
        >
          {cellLabel}
        </Typography>
      </Tooltip>
    </Th>
  );
};

const SortIcon = styled(CarretDown)<{
  isUp?: boolean;
}>`
  transform: ${({ isUp = false }) => `rotate(${isUp ? '180' : '0'}deg)`};
`;

/* -------------------------------------------------------------------------------------------------
 * Root
 * -----------------------------------------------------------------------------------------------*/

interface RootProps
  extends Partial<Pick<TableContextValue, 'colCount' | 'rows' | 'isLoading' | 'isFetching'>> {
  children?: React.ReactNode;
  defaultSelectedEntries?: Entity.ID[];
}

const Root = ({
  children,
  defaultSelectedEntries = [],
  rows = [],
  colCount = 0,
  isLoading = false,
  isFetching = false,
}: RootProps) => {
  const [selectedEntries, setSelectedEntries] = React.useState<Entity.ID[]>(defaultSelectedEntries);
  const rowCount = rows.length + 1;

  const onSelectRow = React.useCallback<TableContextValue['onSelectRow']>(({ name, value }) => {
    setSelectedEntries((prev) => {
      if (value) {
        return prev.concat(name);
      }

      return prev.filter((id) => id !== name);
    });
  }, []);

  const context = React.useMemo(() => {
    return {
      selectedEntries,
      setSelectedEntries,
      onSelectRow,
      rows,
      isLoading,
      isFetching,
      colCount,
      rowCount,
    };
  }, [
    onSelectRow,
    selectedEntries,
    setSelectedEntries,
    rows,
    isLoading,
    isFetching,
    colCount,
    rowCount,
  ]);

  return <TableContext.Provider value={context}>{children}</TableContext.Provider>;
};

/* -------------------------------------------------------------------------------------------------
 * EmptyBody
 * -----------------------------------------------------------------------------------------------*/

interface EmptyBodyProps extends Partial<EmptyStateLayoutProps> {
  contentType: string;
}

const EmptyBody = ({ contentType, ...rest }: EmptyBodyProps) => {
  const { rows, colCount, isLoading } = useTableContext();
  const { formatMessage } = useIntl();
  const [{ query }] = useQueryParams<{ filters?: string[] }>();
  const hasFilters = query?.filters !== undefined;
  const content = hasFilters
    ? formatMessage(
        {
          id: 'content-manager.components.TableEmpty.withFilters',
          defaultMessage: 'There are no {contentType} with the applied filters...',
        },
        { contentType }
      )
    : formatMessage({
        id: 'app.components.EmptyStateLayout.content-document',
        defaultMessage: 'No content found',
      });

  if (rows?.length > 0 || isLoading) {
    return null;
  }

  return (
    <Tbody>
      <Tr>
        <Td colSpan={colCount}>
          <EmptyStateLayout
            content={content}
            hasRadius
            icon={<EmptyDocuments width="10rem" />}
            {...rest}
          />
        </Td>
      </Tr>
    </Tbody>
  );
};

/* -------------------------------------------------------------------------------------------------
 * LoadingBody
 * -----------------------------------------------------------------------------------------------*/

const LoadingBody = () => {
  const { isLoading, colCount } = useTableContext();

  if (!isLoading) {
    return null;
  }

  return (
    <Tbody>
      <Tr>
        <Td colSpan={colCount}>
          <Flex justifyContent="center">
            <Box padding={11} background="neutral0">
              <Loader>Loading content</Loader>
            </Box>
          </Flex>
        </Td>
      </Tr>
    </Tbody>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Body
 * -----------------------------------------------------------------------------------------------*/
interface BodyProps {
  children: React.ReactNode;
}

const Body = ({ children }: BodyProps) => {
  const { rows, isLoading } = useTableContext();

  if (isLoading || rows.length === 0) {
    return null;
  }

  return <Tbody>{children}</Tbody>;
};

/* -------------------------------------------------------------------------------------------------
 * Content
 * -----------------------------------------------------------------------------------------------*/

interface ContentProps extends Pick<DSTableProps, 'footer'> {
  children: React.ReactNode;
}

const Content = ({ children, footer }: ContentProps) => {
  const { rowCount, colCount } = useTableContext();

  return (
    <DSTable rowCount={rowCount} colCount={colCount} footer={footer}>
      {children}
    </DSTable>
  );
};

const Table = {
  Content,
  Root,
  Body,
  ActionBar,
  Head,
  HeaderCell,
  HeaderHiddenActionsCell,
  HeaderCheckboxCell,
  LoadingBody,
  EmptyBody,
  BulkDeleteButton,
};

export { Table, useTableContext };

export type {
  ActionBarProps,
  BodyProps,
  BulkDeleteButtonProps,
  ContentProps,
  EmptyBodyProps,
  HeaderCellProps,
  HeadProps,
  RootProps,
  TableContextValue,
};
