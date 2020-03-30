import React, { useReducer, useState, useEffect, useRef } from 'react';
import { isEqual, includes, toString } from 'lodash';
import { useHistory, useLocation } from 'react-router-dom';
import { Header } from '@buffetjs/custom';
import { useDebounce, useIsMounted } from '@buffetjs/hooks';
import {
  HeaderSearch,
  PageFooter,
  PopUpWarning,
  LoadingIndicatorPage,
  useGlobalContext,
  generateFiltersFromSearch,
  generateSearchFromFilters,
  request,
  useQuery,
  generateSearchFromObject,
} from 'strapi-helper-plugin';
import {
  formatFileForEditing,
  getRequestUrl,
  getTrad,
  generatePageFromStart,
  generateStartFromPage,
} from '../../utils';
import Container from '../../components/Container';
import ControlsWrapper from '../../components/ControlsWrapper';
import Padded from '../../components/Padded';
import SelectAll from '../../components/SelectAll';
import SortPicker from '../../components/SortPicker';
import Filters from '../../components/Filters';
import List from '../../components/List';
import ListEmpty from '../../components/ListEmpty';
import ModalStepper from '../ModalStepper';
import { deleteFilters, getHeaderLabel } from './utils';
import init from './init';
import reducer, { initialState } from './reducer';

const HomePage = () => {
  const { formatMessage } = useGlobalContext();
  const [reducerState, dispatch] = useReducer(reducer, initialState, init);
  const query = useQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [fileToEdit, setFileToEdit] = useState(null);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [modalInitialStep, setModalInitialStep] = useState('browse');
  const [searchValue, setSearchValue] = useState(query.get('_q') || '');
  const { push } = useHistory();
  const { search } = useLocation();
  const isMounted = useIsMounted();

  const { data, dataCount, dataToDelete, isLoading, searchParams } = reducerState.toJS();
  const pluginName = formatMessage({ id: getTrad('plugin.name') });
  const paramsKeys = ['_limit', '_start', '_q', '_sort'];
  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    handleChangeParams({ target: { name: '_q', value: searchValue } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    const params = generateNewSearch();

    dispatch({
      type: 'SET_PARAMS',
      params,
    });
  }, []);

  const useDeepCompareMemoize = value => {
    const ref = useRef();

    if (!isEqual(value, ref.current)) {
      ref.current = value;
    }

    return ref.current;
  };

  useEffect(() => {
    fetchListData();
  }, [useDeepCompareMemoize(searchParams)]);

  const deleteMedia = async id => {
    const requestURL = getRequestUrl(`files/${id}`);

    try {
      await request(requestURL, {
        method: 'DELETE',
      });
    } catch (err) {
      if (isMounted) {
        strapi.notification.error('notification.error');
      }
    }
  };

  const fetchListData = async () => {
    dispatch({ type: 'GET_DATA' });

    const [data, count] = await Promise.all([fetchData(), fetchDataCount()]);

    if (isMounted) {
      dispatch({
        type: 'GET_DATA_SUCCEEDED',
        data,
        count,
      });
    }
  };

  const fetchData = async () => {
    const dataRequestURL = getRequestUrl('files');
    const params = generateSearchFromObject(searchParams);

    try {
      const data = await request(`${dataRequestURL}?${params}`, {
        method: 'GET',
      });

      return Promise.resolve(data);
    } catch (err) {
      if (isMounted) {
        dispatch({ type: 'GET_DATA_ERROR' });
        strapi.notification.error('notification.error');
      }
    }

    return [];
  };

  const fetchDataCount = async () => {
    const requestURL = getRequestUrl('files/count');

    try {
      const { count } = await request(requestURL, {
        method: 'GET',
      });

      return Promise.resolve(count);
    } catch (err) {
      if (isMounted) {
        dispatch({ type: 'GET_DATA_ERROR' });
        strapi.notification.error('notification.error');
      }
    }

    return null;
  };

  const getSearchParams = () => {
    const params = {};

    query.forEach((value, key) => {
      if (includes(paramsKeys, key)) {
        params[key] = value;
      }
    });

    return params;
  };

  const generateNewSearch = (updatedParams = {}) => {
    return {
      ...getSearchParams(),
      filters: generateFiltersFromSearch(search),
      ...updatedParams,
    };
  };

  const handleChangeCheck = ({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE_DATA_TO_DELETE',
      id: parseInt(name, 10),
      value,
    });
  };

  const handleChangeListParams = ({ target: { name, value } }) => {
    if (name.includes('_page')) {
      handleChangeParams({
        target: { name: '_start', value: generateStartFromPage(value, limit) },
      });
    } else {
      handleChangeParams({ target: { name: '_limit', value } });
    }
  };

  const handleChangeParams = ({ target: { name, value } }) => {
    const updatedQueryParams = generateNewSearch({ [name]: value });
    const newSearch = generateSearchFromFilters(updatedQueryParams);

    dispatch({
      type: 'SET_PARAM',
      name,
      value,
    });

    push({ search: encodeURI(newSearch) });
  };

  const handleChangeSearchValue = ({ target: { value } }) => {
    setSearchValue(value);
  };

  const handleClickEditFile = id => {
    const file = formatFileForEditing(data.find(file => toString(file.id) === toString(id)));

    setFileToEdit(file);
    setModalInitialStep('edit');
    handleClickToggleModal();
  };

  const handleClearSearch = () => {
    setSearchValue('');
  };

  const handleClickToggleModal = (refetch = false) => {
    setIsModalOpen(prev => !prev);
    setShouldRefetch(refetch);
  };

  const handleClickTogglePopup = () => {
    setIsPopupOpen(prev => !prev);
  };

  const handleDeleteFilter = filter => {
    const currentFilters = generateFiltersFromSearch(search);
    const updatedFilters = deleteFilters(currentFilters, filter);

    handleChangeParams({
      target: { name: 'filters', value: updatedFilters },
    });
  };

  const handleDeleteMediaFromModal = async id => {
    handleClickToggleModal();

    lockAppWithOverlay();

    try {
      await deleteMedia(id);

      strapi.notification.success('notification.success.delete');

      dispatch({
        type: 'ON_DELETE_MEDIA_SUCCEEDED',
        mediaId: id,
      });
    } catch (err) {
      // Silent
    } finally {
      strapi.unlockApp();
    }
  };

  const handleDeleteMedias = async () => {
    setIsPopupOpen(false);

    lockAppWithOverlay();

    try {
      await Promise.all(dataToDelete.map(item => deleteMedia(item.id)));

      dispatch({
        type: 'CLEAR_DATA_TO_DELETE',
      });

      fetchListData();
    } catch (error) {
      // Silent
    } finally {
      strapi.unlockApp();
    }
  };

  const handleModalClose = () => {
    resetModalState();

    if (shouldRefetch) {
      fetchListData();
      setShouldRefetch(false);
    }
  };

  const handleSelectAll = () => {
    dispatch({
      type: 'TOGGLE_SELECT_ALL',
    });
  };

  const lockAppWithOverlay = () => {
    const overlayblockerParams = {
      children: <div />,
      noGradient: true,
    };

    strapi.lockApp(overlayblockerParams);
  };

  const resetModalState = () => {
    setModalInitialStep('browse');
    setFileToEdit(null);
  };

  const headerProps = {
    title: {
      label: pluginName,
    },
    content: formatMessage(
      {
        id: getTrad(getHeaderLabel(data)),
      },
      { number: dataCount }
    ),
    actions: [
      {
        disabled: dataToDelete.length === 0,
        color: 'cancel',
        // TradId from the strapi-admin package
        label: formatMessage({ id: 'app.utils.delete' }),
        onClick: () => setIsPopupOpen(true),
        type: 'button',
      },
      {
        disabled: false,
        color: 'primary',
        label: formatMessage({ id: getTrad('header.actions.upload-assets') }),
        onClick: () => handleClickToggleModal(),
        type: 'button',
      },
    ],
  };

  const limit = parseInt(query.get('_limit'), 10) || 10;
  const start = parseInt(query.get('_start'), 10) || 0;

  const params = {
    _limit: limit,
    _page: generatePageFromStart(start, limit),
  };

  const paginationCount = data.length < limit ? data.length : dataCount;

  const hasSomeCheckboxSelected = data.some(item =>
    dataToDelete.find(itemToDelete => item.id === itemToDelete.id)
  );

  const areAllCheckboxesSelected =
    data.every(item => dataToDelete.find(itemToDelete => item.id === itemToDelete.id)) &&
    hasSomeCheckboxSelected;

  if (isLoading) {
    return <LoadingIndicatorPage />;
  }

  return (
    <Container>
      <Header {...headerProps} />
      <HeaderSearch
        label={pluginName}
        onChange={handleChangeSearchValue}
        onClear={handleClearSearch}
        placeholder={formatMessage({ id: getTrad('search.placeholder') })}
        name="_q"
        value={searchValue}
      />
      <ControlsWrapper>
        <SelectAll
          onChange={handleSelectAll}
          checked={areAllCheckboxesSelected}
          someChecked={hasSomeCheckboxSelected && !areAllCheckboxesSelected}
        />
        <SortPicker onChange={handleChangeParams} value={query.get('_sort') || null} />
        <Filters
          onChange={handleChangeParams}
          filters={generateFiltersFromSearch(search)}
          onClick={handleDeleteFilter}
        />
      </ControlsWrapper>
      {dataCount > 0 ? (
        <>
          <List
            clickable
            data={data}
            onChange={handleChangeCheck}
            onClickEditFile={handleClickEditFile}
            selectedItems={dataToDelete}
          />
          <PageFooter
            context={{ emitEvent: () => {} }}
            count={paginationCount}
            onChangeParams={handleChangeListParams}
            params={params}
          />
        </>
      ) : (
        <ListEmpty onClick={handleClickToggleModal} />
      )}
      <ModalStepper
        initialFileToEdit={fileToEdit}
        initialStep={modalInitialStep}
        isOpen={isModalOpen}
        onClosed={handleModalClose}
        onDeleteMedia={handleDeleteMediaFromModal}
        onToggle={handleClickToggleModal}
        refetchData={fetchListData}
      />
      <PopUpWarning
        isOpen={isPopupOpen}
        toggleModal={handleClickTogglePopup}
        popUpWarningType="danger"
        onConfirm={handleDeleteMedias}
      />
      <Padded bottom size="md" />
      <Padded bottom size="md" />
    </Container>
  );
};

export default HomePage;
