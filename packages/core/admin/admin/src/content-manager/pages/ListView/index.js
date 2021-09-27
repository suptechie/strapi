import React, { memo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import isEqual from 'react-fast-compare';
import { bindActionCreators, compose } from 'redux';
import { useIntl } from 'react-intl';
import { useHistory, useLocation } from 'react-router-dom';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { stringify } from 'qs';
import {
  NoPermissions,
  // CheckPermissions,
  Search,
  useFocusWhenNavigate,
  useQueryParams,
  useNotification,
  useRBACProvider,
  useTracking,
} from '@strapi/helper-plugin';
import { Main } from '@strapi/parts/Main';
import { ActionLayout, ContentLayout, HeaderLayout } from '@strapi/parts/Layout';
import { useNotifyAT } from '@strapi/parts/LiveRegions';
import { Button } from '@strapi/parts/Button';
import { Row } from '@strapi/parts/Row';
import Add from '@strapi/icons/Add';
import axios from 'axios';
import { axiosInstance } from '../../../core/utils';
import { InjectionZone } from '../../../shared/components';
import DynamicTable from '../../components/DynamicTable';
// import permissions from '../../../permissions';
import { getRequestUrl, getTrad } from '../../utils';
import FieldPicker from './FieldPicker';
import PaginationFooter from './PaginationFooter';
import { getData, getDataSucceeded, onChangeListHeaders, onResetListHeaders } from './actions';
import makeSelectListView from './selectors';
import { buildQueryString } from './utils';
import AttributeFilter from '../../components/AttributeFilter';

// TODO
// const cmPermissions = permissions.contentManager;

/* eslint-disable react/no-array-index-key */
function ListView({
  canCreate,
  canDelete,
  canRead,
  data,
  getData,
  getDataSucceeded,
  isLoading,
  layout,
  pagination,
  slug,
}) {
  const { total } = pagination;
  const {
    contentType: {
      metadatas,
      settings: { bulkable: isBulkable, filterable: isFilterable, searchable: isSearchable },
    },
  } = layout;

  const toggleNotification = useNotification();
  const { trackUsage } = useTracking();
  const { refetchPermissions } = useRBACProvider();
  const trackUsageRef = useRef(trackUsage);
  const fetchPermissionsRef = useRef(refetchPermissions);
  const { notifyStatus } = useNotifyAT();

  useFocusWhenNavigate();

  const [{ query }] = useQueryParams();
  const params = buildQueryString(query);

  const { pathname } = useLocation();
  const { push } = useHistory();
  const { formatMessage } = useIntl();
  const contentType = layout.contentType;
  const hasDraftAndPublish = get(contentType, 'options.draftAndPublish', false);

  // FIXME
  // Using a ref to avoid requests being fired multiple times on slug on change
  // We need it because the hook as mulitple dependencies so it may run before the permissions have checked
  const requestUrlRef = useRef('');

  const fetchData = useCallback(
    async (endPoint, source) => {
      getData();

      try {
        const opts = source ? { cancelToken: source.token } : null;
        const {
          data: { results, pagination: paginationResult },
        } = await axiosInstance.get(endPoint, opts);

        notifyStatus(
          formatMessage(
            {
              id: getTrad('utils.data-loaded'),
              defaultMessage:
                '{number, plural, =1 {# entry has} other {# entries have}} successfully been loaded',
            },
            // Using the plural form
            { number: paginationResult.count }
          )
        );

        getDataSucceeded(paginationResult, results);
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        }

        const resStatus = get(err, 'response.status', null);

        if (resStatus === 403) {
          await fetchPermissionsRef.current();

          toggleNotification({
            type: 'info',
            message: { id: getTrad('permissions.not-allowed.update') },
          });

          push('/');

          return;
        }

        console.log('iii');

        console.error(err);
        toggleNotification({
          type: 'warning',
          message: { id: getTrad('error.model.fetch') },
        });
      }
    },
    [formatMessage, getData, getDataSucceeded, notifyStatus, push, toggleNotification]
  );

  const handleConfirmDeleteAllData = useCallback(
    async ids => {
      try {
        await axiosInstance.post(getRequestUrl(`collection-types/${slug}/actions/bulkDelete`), {
          ids,
        });

        const requestUrl = getRequestUrl(`collection-types/${slug}${params}`);
        fetchData(requestUrl);
        trackUsageRef.current('didBulkDeleteEntries');
      } catch (err) {
        toggleNotification({
          type: 'warning',
          message: { id: getTrad('error.record.delete') },
        });
      }
    },
    [fetchData, params, slug, toggleNotification]
  );

  const handleConfirmDeleteData = useCallback(
    async idToDelete => {
      try {
        let trackerProperty = {};

        if (hasDraftAndPublish) {
          const dataToDelete = data.find(obj => obj.id.toString() === idToDelete.toString());
          const isDraftEntry = isEmpty(dataToDelete.publishedAt);
          const status = isDraftEntry ? 'draft' : 'published';

          trackerProperty = { status };
        }

        trackUsageRef.current('willDeleteEntry', trackerProperty);

        await axiosInstance.delete(getRequestUrl(`collection-types/${slug}/${idToDelete}`));

        const requestUrl = getRequestUrl(`collection-types/${slug}${params}`);
        fetchData(requestUrl);

        toggleNotification({
          type: 'success',
          message: { id: getTrad('success.record.delete') },
        });

        trackUsageRef.current('didDeleteEntry', trackerProperty);
      } catch (err) {
        const errorMessage = get(
          err,
          'response.payload.message',
          formatMessage({ id: getTrad('error.record.delete') })
        );

        toggleNotification({
          type: 'warning',
          message: errorMessage,
        });
      }
    },
    [hasDraftAndPublish, slug, params, fetchData, toggleNotification, data, formatMessage]
  );

  useEffect(() => {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    const shouldSendRequest = canRead;
    const requestUrl = getRequestUrl(`collection-types/${slug}${params}`);

    if (shouldSendRequest && requestUrl.includes(requestUrlRef.current)) {
      fetchData(requestUrl, source);
    }

    return () => {
      requestUrlRef.current = slug;

      source.cancel('Operation canceled by the user.');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRead, getData, slug, params, getDataSucceeded, fetchData]);

  const defaultHeaderLayoutTitle = formatMessage({
    id: getTrad('header.name'),
    defaultMessage: 'Content',
  });
  const headerLayoutTitle = formatMessage({
    id: contentType.info.label,
    defaultMessage: contentType.info.label || defaultHeaderLayoutTitle,
  });

  const subtitle = canRead
    ? formatMessage(
        {
          id: getTrad('pages.ListView.header-subtitle'),
          defaultMessage: '{number, plural, =0 {# entries} one {# entry} other {# entries}} found',
        },
        { number: total }
      )
    : null;

  const createAction = canCreate ? (
    <Button
      onClick={() => {
        const trackerProperty = hasDraftAndPublish ? { status: 'draft' } : {};

        trackUsageRef.current('willCreateEntry', trackerProperty);
        push({
          pathname: `${pathname}/create`,
          search: query.plugins ? stringify({ plugins: query.plugins }, { encode: false }) : '',
        });
      }}
      startIcon={<Add />}
    >
      {formatMessage({
        id: getTrad('HeaderLayout.button.label-add-entry'),
        defaultMessage: 'Add new entry',
      })}
    </Button>
  ) : null;

  return (
    <Main aria-busy={isLoading}>
      <HeaderLayout primaryAction={createAction} subtitle={subtitle} title={headerLayoutTitle} />
      {!canRead && (
        <ActionLayout endActions={<InjectionZone area="contentManager.listView.actions" />} />
      )}
      {canRead && (isSearchable || isFilterable) && (
        <ActionLayout
          endActions={
            <Row style={{ flexShrink: 0 }}>
              <InjectionZone area="contentManager.listView.actions" />
              <FieldPicker layout={layout} />
            </Row>
          }
          startActions={
            <>
              {isSearchable && (
                <Search
                  label={formatMessage(
                    { id: 'app.component.search.label', defaultMessage: 'Search for {target}' },
                    { target: headerLayoutTitle }
                  )}
                  trackedEvent="didSearch"
                />
              )}
              {isFilterable && (
                <AttributeFilter contentType={contentType} slug={slug} metadatas={metadatas} />
              )}
            </>
          }
        />
      )}
      <ContentLayout>
        {canRead ? (
          <>
            <DynamicTable
              canCreate={canCreate}
              canDelete={canDelete}
              contentTypeName={headerLayoutTitle}
              onConfirmDeleteAll={handleConfirmDeleteAllData}
              onConfirmDelete={handleConfirmDeleteData}
              isBulkable={isBulkable}
              isLoading={isLoading}
              // FIXME: remove the layout props drilling
              layout={layout}
              rows={data}
            />
            <PaginationFooter pagination={{ pageCount: pagination?.pageCount || 1 }} />
          </>
        ) : (
          <NoPermissions />
        )}
      </ContentLayout>
    </Main>
  );
}

ListView.propTypes = {
  canCreate: PropTypes.bool.isRequired,
  canDelete: PropTypes.bool.isRequired,
  canRead: PropTypes.bool.isRequired,
  data: PropTypes.array.isRequired,
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
  isLoading: PropTypes.bool.isRequired,
  getData: PropTypes.func.isRequired,
  getDataSucceeded: PropTypes.func.isRequired,
  pagination: PropTypes.shape({ total: PropTypes.number.isRequired, pageCount: PropTypes.number })
    .isRequired,
  slug: PropTypes.string.isRequired,
};

const mapStateToProps = makeSelectListView();

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      getData,
      getDataSucceeded,
      onChangeListHeaders,
      onResetListHeaders,
    },
    dispatch
  );
}
const withConnect = connect(mapStateToProps, mapDispatchToProps);

export default compose(withConnect)(memo(ListView, isEqual));
