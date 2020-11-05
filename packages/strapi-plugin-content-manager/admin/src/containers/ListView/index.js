import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators, compose } from 'redux';
import { get, isEmpty } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import { Header } from '@buffetjs/custom';
import {
  PopUpWarning,
  generateFiltersFromSearch,
  request,
  CheckPermissions,
  useGlobalContext,
  useUserPermissions,
  useQuery,
} from 'strapi-helper-plugin';
import pluginId from '../../pluginId';
import pluginPermissions from '../../permissions';
import { useQueryParams } from '../../hooks';
import {
  formatFiltersFromQuery,
  generatePermissionsObject,
  getRequestUrl,
  getTrad,
} from '../../utils';

import DisplayedFieldsDropdown from '../../components/DisplayedFieldsDropdown';
import Container from '../../components/Container';
import CustomTable from '../../components/CustomTable';

import FilterPicker from '../../components/FilterPicker';
import Search from '../../components/Search';
import ListViewProvider from '../ListViewProvider';
import { AddFilterCta, FilterIcon, Wrapper } from './components';
import Filter from './Filter';
import Footer from './Footer';
import {
  getData,
  getDataSucceeded,
  onChangeBulk,
  onChangeBulkSelectall,
  onDeleteDataError,
  onDeleteDataSucceeded,
  onDeleteSeveralDataSucceeded,
  resetProps,
  setModalLoadingState,
  toggleModalDelete,
  toggleModalDeleteAll,
  //
  setLayout,
  onChangeListHeaders,
  onResetListHeaders,
} from './actions';
import makeSelectListView from './selectors';

import { getAllAllowedHeaders, getFirstSortableHeader } from './utils';

/* eslint-disable react/no-array-index-key */

// const FilterPicker = () => <div>FILTER</div>;

function ListView({
  count,
  data,
  didDeleteData,

  entriesToDelete,
  isLoading,
  // location: { pathname },
  getData,
  getDataSucceeded,

  onChangeBulk,
  onChangeBulkSelectall,
  onDeleteDataError,
  onDeleteDataSucceeded,
  onDeleteSeveralDataSucceeded,

  resetProps,
  setModalLoadingState,
  showWarningDelete,
  showModalConfirmButtonLoading,
  showWarningDeleteAll,
  slug,
  toggleModalDelete,
  toggleModalDeleteAll,

  // NEW
  // allAllowedHeaders,
  displayedHeaders,
  layout,
  onChangeListHeaders,
  onResetListHeaders,
  setLayout,
}) {
  const {
    contentType: {
      attributes,
      settings: {
        defaultSortBy,
        defaultSortOrder,
        bulkable: isBulkable,
        filterable: isFilterable,
        searchable: isSearchable,
        pageSize: defaultPageSize,
        // mainField,
      },
    },
  } = layout;

  const { emitEvent } = useGlobalContext();
  const emitEventRef = useRef(emitEvent);
  const viewPermissions = useMemo(() => generatePermissionsObject(slug), [slug]);
  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canCreate, canRead, canUpdate, canDelete },
  } = useUserPermissions(viewPermissions);
  const defaultSort = `${defaultSortBy}:${defaultSortOrder}`;
  const [{ query, rawQuery }, setQuery] = useQueryParams({
    page: 1,
    pageSize: defaultPageSize,
    _sort: defaultSort,
  });
  const { pathname, search } = useLocation();
  const { push } = useHistory;

  const isFirstRender = useRef(true);
  const { formatMessage } = useIntl();

  const [isFilterPickerOpen, setFilterPickerState] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  const contentType = layout.contentType;

  const hasDraftAndPublish = contentType.options.draftAndPublish;

  const allAllowedHeaders = getAllAllowedHeaders(attributes);

  const filters = useMemo(() => {
    return formatFiltersFromQuery(query);
  }, [query]);

  const _limit = parseInt(query.pageSize, 10);
  const _page = parseInt(query.page, 10);
  const _sort = query._sort;
  const _q = query._q || '';

  const label = contentType.info.label;

  const searchToSendForRequest = rawQuery;
  const getDataSucceededRef = useRef(getDataSucceeded);

  const shouldSendRequest = useMemo(() => {
    return !isLoadingForPermissions && canRead;
  }, [canRead, isLoadingForPermissions]);

  const fetchData = async () => {
    try {
      const data = [
        {
          id: 16,
          postal_coder: 'kkkk',
          city: 'kljkojihv',
          created_by: {
            id: 1,
            firstname: 'cyril',
            lastname: 'lopez',
            username: null,
            email: 'cyril@strapi.io',
            resetPasswordToken: null,
            registrationToken: null,
            isActive: true,
            blocked: null,
          },
          updated_by: {
            id: 1,
            firstname: 'cyril',
            lastname: 'lopez',
            username: null,
            email: 'cyril@strapi.io',
            resetPasswordToken: null,
            registrationToken: null,
            isActive: true,
            blocked: null,
          },
          created_at: '2020-10-28T09:03:20.905Z',
          updated_at: '2020-10-28T13:51:35.381Z',
          published_at: '2020-10-28T13:51:35.351Z',
          cover: null,
          images: [],
          categories: [],
          likes: [],
        },
      ];

      getDataSucceededRef.current(1, data);
    } catch (err) {
      strapi.notification.error(`${pluginId}.error.model.fetch`);
    }
  };

  useEffect(() => {
    setLayout(layout);
  }, [layout, setLayout]);

  const firstSortableHeader = useMemo(() => getFirstSortableHeader(displayedHeaders), [
    displayedHeaders,
  ]);

  useEffect(() => {
    return () => {
      isFirstRender.current = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!isFirstRender.current) {
      fetchData(searchToSendForRequest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchToSendForRequest]);

  useEffect(() => {
    return () => {
      resetProps();
      setFilterPickerState(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (shouldSendRequest) {
      fetchData();
    }

    return () => {
      isFirstRender.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldSendRequest]);

  const handleConfirmDeleteData = useCallback(async () => {
    try {
      let trackerProperty = {};

      if (hasDraftAndPublish) {
        const dataToDelete = data.find(obj => obj.id.toString() === idToDelete.toString());
        const isDraftEntry = isEmpty(dataToDelete.published_at);
        const status = isDraftEntry ? 'draft' : 'published';

        trackerProperty = { status };
      }

      emitEvent('willDeleteEntry', trackerProperty);
      setModalLoadingState();

      await request(getRequestUrl(`explorer/${slug}/${idToDelete}`), {
        method: 'DELETE',
      });

      strapi.notification.success(`${pluginId}.success.record.delete`);

      // Close the modal and refetch data
      onDeleteDataSucceeded();
      emitEvent('didDeleteEntry', trackerProperty);
    } catch (err) {
      const errorMessage = get(
        err,
        'response.payload.message',
        formatMessage({ id: `${pluginId}.error.record.delete` })
      );

      strapi.notification.error(errorMessage);
      // Close the modal
      onDeleteDataError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setModalLoadingState, slug, idToDelete, onDeleteDataSucceeded, hasDraftAndPublish, data]);

  const handleConfirmDeleteAllData = useCallback(async () => {
    const params = Object.assign(entriesToDelete);

    try {
      setModalLoadingState();

      await request(getRequestUrl(`explorer/deleteAll/${slug}`), {
        method: 'DELETE',
        params,
      });

      onDeleteSeveralDataSucceeded();
    } catch (err) {
      strapi.notification.error(`${pluginId}.error.record.delete`);
    }
  }, [entriesToDelete, onDeleteSeveralDataSucceeded, slug, setModalLoadingState]);

  const handleChangeListLabels = useCallback(
    ({ name, value }) => {
      //   const currentSort = _sort;
      // // Display a notification if trying to remove the last displayed field
      if (value && displayedHeaders.length === 1) {
        strapi.notification.error('content-manager.notification.error.displayedFields');

        return false;
      }

      // TODO
      // // Update the sort when removing the displayed one
      // if (currentSort.split(':')[0] === name && value) {
      //   emitEvent('didChangeDisplayedFields');
      //   handleChangeSearch({
      //     target: {
      //       name: '_sort',
      //       value: `${firstSortableHeader}:ASC`,
      //     },
      //   });
      // }

      onChangeListHeaders({ name, value });
    },
    [displayedHeaders, onChangeListHeaders]
  );

  const handleChangeSearch = async ({ target: { name, value } }) => {
    const currentSearch = new URLSearchParams(searchToSendForRequest);

    // Pagination
    currentSearch.delete('_start');

    if (value === '') {
      currentSearch.delete(name);
    } else {
      currentSearch.set(name, value);
    }

    const searchToString = currentSearch.toString();

    push({ search: searchToString });
  };

  const handleClickDelete = id => {
    setIdToDelete(id);
    toggleModalDelete();
  };

  const handleModalClose = () => {
    if (didDeleteData) {
      fetchData();
    }
  };

  const toggleFilterPickerState = useCallback(() => {
    setFilterPickerState(prevState => {
      if (!prevState) {
        emitEventRef.current('willFilterEntries');
      }

      return !prevState;
    });
  }, []);

  const headerAction = useMemo(
    () => {
      if (!canCreate) {
        return [];
      }

      return [
        {
          label: formatMessage(
            {
              id: 'content-manager.containers.List.addAnEntry',
            },
            {
              entity: label || 'Content Manager',
            }
          ),
          onClick: () => {
            const trackerProperty = hasDraftAndPublish ? { status: 'draft' } : {};

            emitEvent('willCreateEntry', trackerProperty);
            push({
              pathname: `${pathname}/create`,
            });
          },
          color: 'primary',
          type: 'button',
          icon: true,
          style: {
            paddingLeft: 15,
            paddingRight: 15,
            fontWeight: 600,
          },
        },
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [label, pathname, search, canCreate, formatMessage, hasDraftAndPublish]
  );

  const headerProps = useMemo(() => {
    /* eslint-disable indent */
    return {
      title: {
        label: label || 'Content Manager',
      },
      content: canRead
        ? formatMessage(
            {
              id:
                count > 1
                  ? `${pluginId}.containers.List.pluginHeaderDescription`
                  : `${pluginId}.containers.List.pluginHeaderDescription.singular`,
            },
            { label: count }
          )
        : null,
      actions: headerAction,
    };
    /* eslint-enable indent */
  }, [count, headerAction, label, canRead, formatMessage]);

  return (
    <>
      <ListViewProvider
        data={data}
        // TO remove
        count={count}
        //
        entriesToDelete={entriesToDelete}
        emitEvent={emitEvent}
        label={label}
        onChangeBulk={onChangeBulk}
        onChangeBulkSelectall={onChangeBulkSelectall}
        onChangeSearch={handleChangeSearch}
        onClickDelete={handleClickDelete}
        // schema={listSchema}
        schema={{}}
        slug={slug}
        toggleModalDeleteAll={toggleModalDeleteAll}
        // TODO TO REMOVE ?
        _limit={_limit}
        _page={_page}
        //
        filters={filters}
        _q={_q}
        _sort={_sort}
        // to keep
        firstSortableHeader={firstSortableHeader}
      >
        <FilterPicker
          contentType={contentType}
          isOpen={isFilterPickerOpen}
          name={label}
          toggleFilterPickerState={toggleFilterPickerState}
          setQuery={setQuery}
          filters={filters}
          slug={slug}
        />
        <Container className="container-fluid">
          {!isFilterPickerOpen && <Header {...headerProps} isLoading={isLoading && canRead} />}
          {isSearchable && canRead && (
            <Search changeParams={setQuery} initValue={_q} model={label} value={_q} />
          )}
          {canRead && (
            <Wrapper>
              <div className="row" style={{ marginBottom: '5px' }}>
                <div className="col-10">
                  <div className="row" style={{ marginLeft: 0, marginRight: 0 }}>
                    {isFilterable && (
                      <>
                        <AddFilterCta type="button" onClick={toggleFilterPickerState}>
                          <FilterIcon />
                          <FormattedMessage id="app.utils.filters" />
                        </AddFilterCta>
                        {filters.map(({ filter: filterName, name }, key) => (
                          <Filter
                            contentType={contentType}
                            filterName={filterName}
                            filters={filters}
                            index={key}
                            key={key}
                            name={name}
                            toggleFilterPickerState={toggleFilterPickerState}
                            isFilterPickerOpen={isFilterPickerOpen}
                            setQuery={setQuery}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div className="col-2">
                  <CheckPermissions permissions={pluginPermissions.collectionTypesConfigurations}>
                    <DisplayedFieldsDropdown
                      displayedHeaders={displayedHeaders}
                      items={allAllowedHeaders}
                      // items={allAllowedHeaders}
                      onChange={handleChangeListLabels}
                      onClickReset={onResetListHeaders}
                      slug={slug}
                    />
                  </CheckPermissions>
                </div>
              </div>
              <div className="row" style={{ paddingTop: '12px' }}>
                <div className="col-12">
                  <CustomTable
                    data={data}
                    canDelete={canDelete}
                    canUpdate={canUpdate}
                    displayedHeaders={displayedHeaders}
                    hasDraftAndPublish={hasDraftAndPublish}
                    isBulkable={isBulkable}
                    onChangeParams={handleChangeSearch}
                    showLoader={isLoading}
                  />
                  <Footer count={count} params={query} onChange={setQuery} />
                </div>
              </div>
            </Wrapper>
          )}
        </Container>
        <PopUpWarning
          isOpen={showWarningDelete}
          toggleModal={toggleModalDelete}
          content={{
            message: getTrad('popUpWarning.bodyMessage.contentType.delete'),
          }}
          onConfirm={handleConfirmDeleteData}
          popUpWarningType="danger"
          onClosed={handleModalClose}
          isConfirmButtonLoading={showModalConfirmButtonLoading}
        />
        <PopUpWarning
          isOpen={showWarningDeleteAll}
          toggleModal={toggleModalDeleteAll}
          content={{
            message: getTrad(
              `popUpWarning.bodyMessage.contentType.delete${
                entriesToDelete.length > 1 ? '.all' : ''
              }`
            ),
          }}
          popUpWarningType="danger"
          onConfirm={handleConfirmDeleteAllData}
          onClosed={handleModalClose}
          isConfirmButtonLoading={showModalConfirmButtonLoading}
        />
      </ListViewProvider>
    </>
  );
}
ListView.defaultProps = {
  // layouts: {},
};

ListView.propTypes = {
  // allAllowedHeaders: PropTypes.array.isRequired,
  displayedHeaders: PropTypes.array.isRequired,
  layout: PropTypes.exact({
    components: PropTypes.object.isRequired,
    contentType: PropTypes.shape({
      attributes: PropTypes.object.isRequired,
      info: PropTypes.shape({ label: PropTypes.string.isRequired }).isRequired,
      layouts: PropTypes.shape({
        list: PropTypes.array.isRequired,
      }).isRequired,
      options: PropTypes.object.isRequired,
      settings: PropTypes.object.isRequired,
    }).isRequired,
  }).isRequired,
  // count: PropTypes.number.isRequired,
  // data: PropTypes.array.isRequired,
  // didDeleteData: PropTypes.bool.isRequired,
  // // emitEvent: PropTypes.func.isRequired,
  // entriesToDelete: PropTypes.array.isRequired,
  // isLoading: PropTypes.bool.isRequired,
  // layouts: PropTypes.object,
  // location: PropTypes.shape({
  //   pathname: PropTypes.string.isRequired,
  //   search: PropTypes.string.isRequired,
  // }).isRequired,
  // // models: PropTypes.array.isRequired,
  // getData: PropTypes.func.isRequired,
  // getDataSucceeded: PropTypes.func.isRequired,
  // history: PropTypes.shape({
  //   push: PropTypes.func.isRequired,
  // }).isRequired,
  // onChangeBulk: PropTypes.func.isRequired,
  // onChangeBulkSelectall: PropTypes.func.isRequired,
  onChangeListHeaders: PropTypes.func.isRequired,
  // onDeleteDataError: PropTypes.func.isRequired,
  // onDeleteDataSucceeded: PropTypes.func.isRequired,
  // onDeleteSeveralDataSucceeded: PropTypes.func.isRequired,
  onResetListHeaders: PropTypes.func.isRequired,
  // resetProps: PropTypes.func.isRequired,
  // setModalLoadingState: PropTypes.func.isRequired,
  // showModalConfirmButtonLoading: PropTypes.bool.isRequired,
  // showWarningDelete: PropTypes.bool.isRequired,
  // showWarningDeleteAll: PropTypes.bool.isRequired,
  // slug: PropTypes.string.isRequired,
  // toggleModalDelete: PropTypes.func.isRequired,
  // toggleModalDeleteAll: PropTypes.func.isRequired,
  setLayout: PropTypes.func.isRequired,
};

const mapStateToProps = makeSelectListView();

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      getData,
      getDataSucceeded,
      onChangeBulk,
      onChangeBulkSelectall,
      onChangeListHeaders,
      onDeleteDataError,
      onDeleteDataSucceeded,
      onDeleteSeveralDataSucceeded,
      onResetListHeaders,
      resetProps,
      setModalLoadingState,
      toggleModalDelete,
      toggleModalDeleteAll,
      setLayout,
    },
    dispatch
  );
}
const withConnect = connect(mapStateToProps, mapDispatchToProps);

export default compose(withConnect, memo)(ListView);
