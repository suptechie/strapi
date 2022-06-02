import React, { useState } from 'react'; // useState
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import {
  LoadingIndicatorPage,
  useFocusWhenNavigate,
  NoPermissions,
  AnErrorOccurred,
  SearchURLQuery,
  useSelectionState,
  useQueryParams,
} from '@strapi/helper-plugin';
import { Layout, ContentLayout, ActionLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Button } from '@strapi/design-system/Button';
import Plus from '@strapi/icons/Plus';
import { Box } from '@strapi/design-system/Box';
import { Stack } from '@strapi/design-system/Stack';
import { BaseCheckbox } from '@strapi/design-system/BaseCheckbox';
import { UploadAssetDialog } from '../../components/UploadAssetDialog/UploadAssetDialog';
import { EditFolderDialog } from '../../components/EditFolderDialog';
import { EditAssetDialog } from '../../components/EditAssetDialog';
import { AssetList } from '../../components/AssetList';
import { FolderList } from '../../components/FolderList';
import SortPicker from '../../components/SortPicker';
import { useAssets } from '../../hooks/useAssets';
import { useFolders } from '../../hooks/useFolders';
import { getTrad } from '../../utils';
import { PaginationFooter } from '../../components/PaginationFooter';
import { useMediaLibraryPermissions } from '../../hooks/useMediaLibraryPermissions';
import { EmptyAssets } from '../../components/EmptyAssets';
import { BulkDeleteButton } from './components/BulkDeleteButton';
import { Filters } from './components/Filters';
import { Header } from './components/Header';

const BoxWithHeight = styled(Box)`
  height: ${32 / 16}rem;
  display: flex;
  align-items: center;
`;

export const MediaLibrary = () => {
  const {
    canRead,
    canCreate,
    canUpdate,
    canCopyLink,
    canDownload,
    isLoading: permissionsLoading,
  } = useMediaLibraryPermissions();
  const { formatMessage } = useIntl();
  const [{ query }, setQuery] = useQueryParams();
  const isFiltering = Boolean(query._q || query.filters);

  const { data: assetsData, isLoading: assetsLoading, errors: assetsError } = useAssets({
    skipWhen: !canRead,
    query,
  });

  const { data: folders, isLoading: foldersLoading, errors: foldersError } = useFolders({
    enabled: assetsData?.pagination?.page === 1,
    query,
  });

  const folderCount = folders?.length || 0;
  const assets = assetsData?.results;
  const assetCount = assets?.length ?? 0;
  const isLoading = foldersLoading || permissionsLoading || assetsLoading;
  const [showUploadAssetDialog, setShowUploadAssetDialog] = useState(false);
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(undefined);
  const [folderToEdit, setFolderToEdit] = useState(undefined);
  const [selected, { selectOne, selectAll }] = useSelectionState(['type', 'id'], []);
  const toggleUploadAssetDialog = () => setShowUploadAssetDialog(prev => !prev);
  const toggleEditFolderDialog = ({ created = false } = {}) => {
    // folders are only displayed on the first page, therefore
    // we have to navigate the user to that page, in case a folder
    // was created successfully in order for them to see it
    if (created && query?.page !== '1') {
      setQuery({
        ...query,
        page: 1,
      });
    }

    setShowEditFolderDialog(prev => !prev);
  };

  const handleChangeSort = value => {
    setQuery({ sort: value });
  };

  const handleEditFolder = folder => {
    setFolderToEdit(folder);
    setShowEditFolderDialog(true);
  };

  const handleEditFolderClose = payload => {
    setFolderToEdit(null);
    toggleEditFolderDialog(payload);
  };

  const handleChangeFolder = folder => {
    setQuery({
      ...query,
      folder,
    });
  };

  useFocusWhenNavigate();

  return (
    <Layout>
      <Main aria-busy={isLoading}>
        <Header
          assetCount={assetCount}
          folderCount={folderCount}
          canCreate={canCreate}
          onToggleEditFolderDialog={toggleEditFolderDialog}
          onToggleUploadAssetDialog={toggleUploadAssetDialog}
        />
        <ActionLayout
          startActions={
            <>
              {canUpdate && (
                <BoxWithHeight
                  paddingLeft={2}
                  paddingRight={2}
                  background="neutral0"
                  hasRadius
                  borderColor="neutral200"
                >
                  <BaseCheckbox
                    aria-label={formatMessage({
                      id: getTrad('bulk.select.label'),
                      defaultMessage: 'Select all folders & assets',
                    })}
                    indeterminate={
                      selected?.length > 0 && selected?.length !== assetCount + folderCount
                    }
                    value={
                      (assetCount > 0 || folderCount > 0) &&
                      selected.length === assetCount + folderCount
                    }
                    onChange={() => {
                      selectAll([
                        ...assets.map(asset => ({ ...asset, type: 'asset' })),
                        ...folders.map(folder => ({ ...folder, type: 'folder' })),
                      ]);
                    }}
                  />
                </BoxWithHeight>
              )}
              {canRead && <SortPicker onChangeSort={handleChangeSort} />}
              {canRead && <Filters />}
            </>
          }
          endActions={
            <SearchURLQuery
              label={formatMessage({
                id: getTrad('search.label'),
                defaultMessage: 'Search for an asset',
              })}
            />
          }
        />

        <ContentLayout>
          {selected.length > 0 && <BulkDeleteButton selected={selected} onSuccess={selectAll} />}

          {isLoading && <LoadingIndicatorPage />}

          {(assetsError || foldersError) && <AnErrorOccurred />}

          {!canRead && <NoPermissions />}

          {folderCount === 0 && assetCount === 0 && (
            <EmptyAssets
              action={
                canCreate &&
                !isFiltering && (
                  <Button
                    variant="secondary"
                    startIcon={<Plus />}
                    onClick={toggleUploadAssetDialog}
                  >
                    {formatMessage({
                      id: getTrad('header.actions.add-assets'),
                      defaultMessage: 'Add new assets',
                    })}
                  </Button>
                )
              }
              content={
                // eslint-disable-next-line no-nested-ternary
                isFiltering
                  ? formatMessage({
                      id: getTrad('list.assets-empty.title-withSearch'),
                      defaultMessage: 'There are no elements with the applied filters',
                    })
                  : canCreate
                  ? formatMessage({
                      id: getTrad('list.assets.empty'),
                      defaultMessage: 'Upload your first assets...',
                    })
                  : formatMessage({
                      id: getTrad('list.assets.empty.no-permissions'),
                      defaultMessage: 'The asset list is empty',
                    })
              }
            />
          )}

          {canRead && (
            <Stack spacing={8}>
              {folderCount > 0 && (
                <FolderList
                  folders={folders}
                  onChangeFolder={handleChangeFolder}
                  onEditFolder={handleEditFolder}
                  onSelectFolder={selectOne}
                  selectedFolders={selected.filter(({ type }) => type === 'folder')}
                  title={
                    (((isFiltering && assetCount > 0) || !isFiltering) &&
                      formatMessage({
                        id: getTrad('list.folders.title'),
                        defaultMessage: 'Folders',
                      })) ||
                    ''
                  }
                />
              )}

              {assetCount > 0 && (
                <>
                  <AssetList
                    assets={assets}
                    onEditAsset={setAssetToEdit}
                    onSelectAsset={selectOne}
                    selectedAssets={selected.filter(({ type }) => type === 'asset')}
                    title={
                      ((!isFiltering || (isFiltering && folderCount > 0)) &&
                        assetsData?.pagination?.page === 1 &&
                        formatMessage({
                          id: getTrad('list.assets.title'),
                          defaultMessage: 'Assets',
                        })) ||
                      ''
                    }
                  />

                  {assetsData?.pagination && (
                    <PaginationFooter pagination={assetsData.pagination} />
                  )}
                </>
              )}
            </Stack>
          )}
        </ContentLayout>
      </Main>

      {showUploadAssetDialog && (
        <UploadAssetDialog
          onClose={toggleUploadAssetDialog}
          trackedLocation="upload"
          folderId={query?.folder}
        />
      )}

      {showEditFolderDialog && (
        <EditFolderDialog
          onClose={handleEditFolderClose}
          folder={folderToEdit}
          parentFolderId={query?.folder}
        />
      )}

      {assetToEdit && (
        <EditAssetDialog
          onClose={() => setAssetToEdit(undefined)}
          asset={assetToEdit}
          canUpdate={canUpdate}
          canCopyLink={canCopyLink}
          canDownload={canDownload}
          trackedLocation="upload"
        />
      )}
    </Layout>
  );
};
