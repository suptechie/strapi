import React, { useCallback, useState, useEffect, useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import {
  // FormattedMessage,
  useIntl,
} from 'react-intl';
// import { Link, useLocation } from 'react-router-dom';
// import { findIndex, get, isArray, isEmpty, set } from 'lodash';
import get from 'lodash/get';
import isArray from 'lodash/isArray';
import {
  // DropdownIndicator,

  NotAllowedInput,
  useCMEditViewDataManager,
  // useQueryParams,
} from '@strapi/helper-plugin';
// import { Flex, Text, Padded } from '@buffetjs/core';
// import { stringify } from 'qs';
import axios from 'axios';
import { axiosInstance } from '../../../core/utils';
// import { getTrad } from '../../utils';
import ComingSoonInput from '../Inputs/ComingSoonInput';
// import SelectOne from '../SelectOne';
// import SelectMany from '../SelectMany';
// import ClearIndicator from './ClearIndicator';
// import IndicatorSeparator from './IndicatorSeparator';
// import Option from './Option';
// import { A, BaselineAlignment } from './components';
import {
  connect,
  select,
  // styles
} from './utils';

const initialPaginationState = {
  _contains: '',
  _limit: 20,
  _start: 0,
};

// const buildParams = (query, paramsToKeep) => {
//   if (!paramsToKeep) {
//     return {};
//   }

//   return paramsToKeep.reduce((acc, current) => {
//     const value = get(query, current, null);

//     if (value) {
//       set(acc, current, value);
//     }

//     return acc;
//   }, {});
// };
function SelectWrapper({
  description,
  // editable,
  labelAction,
  intlLabel,
  isCreatingEntry,
  isFieldAllowed,
  isFieldReadable,
  mainField,
  name,
  relationType,
  // targetModel,
  // placeholder,
  queryInfos,
}) {
  const { formatMessage } = useIntl();
  // const [{ query }] = useQueryParams();
  // Disable the input in case of a polymorphic relation
  const isMorph = useMemo(() => relationType.toLowerCase().includes('morph'), [relationType]);
  const {
    // addRelation,
    modifiedData,
    // moveRelation,
    // onChange,
    // onRemoveRelation,
  } = useCMEditViewDataManager();
  // const { pathname } = useLocation();

  const value = get(modifiedData, name, null);
  const [
    state,
    // setState
  ] = useState(initialPaginationState);
  const [
    // options,
    setOptions,
  ] = useState([]);
  const [
    // isLoading,
    setIsLoading,
  ] = useState(false);
  const [
    isOpen,
    // setIsOpen
  ] = useState(false);

  // const filteredOptions = useMemo(() => {
  //   return options.filter(option => {
  //     if (!isEmpty(value)) {
  //       // SelectMany
  //       if (Array.isArray(value)) {
  //         return findIndex(value, o => o.id === option.value.id) === -1;
  //       }

  //       // SelectOne
  //       return get(value, 'id', '') !== option.value.id;
  //     }

  //     return true;
  //   });
  // }, [options, value]);

  const {
    endPoint,
    containsKey,
    defaultParams,
    // shouldDisplayRelationLink,
    // paramsToKeep,
  } = queryInfos;

  const isSingle = ['oneWay', 'oneToOne', 'manyToOne', 'oneToManyMorph', 'oneToOneMorph'].includes(
    relationType
  );

  const idsToOmit = useMemo(() => {
    if (!value) {
      return [];
    }

    if (isSingle) {
      return [value.id];
    }

    return value.map(val => val.id);
  }, [isSingle, value]);

  const getData = useCallback(
    async source => {
      // Currently polymorphic relations are not handled
      if (isMorph) {
        setIsLoading(false);

        return;
      }

      if (!isFieldAllowed) {
        setIsLoading(false);

        return;
      }

      setIsLoading(true);

      const params = { _limit: state._limit, ...defaultParams };

      if (state._contains) {
        params[containsKey] = state._contains;
      }

      try {
        const { data } = await axiosInstance.post(
          endPoint,
          { idsToOmit },
          { params, cancelToken: source.token }
        );

        const formattedData = data.map(obj => {
          return { value: obj, label: obj[mainField.name] };
        });

        setOptions(prevState =>
          prevState.concat(formattedData).filter((obj, index) => {
            const objIndex = prevState.findIndex(el => el.value.id === obj.value.id);

            if (objIndex === -1) {
              return true;
            }

            return prevState.findIndex(el => el.value.id === obj.value.id) === index;
          })
        );
        setIsLoading(false);
      } catch (err) {
        // Silent
        setIsLoading(false);
      }
    },
    [
      containsKey,
      defaultParams,
      endPoint,
      idsToOmit,
      isFieldAllowed,
      isMorph,
      mainField.name,
      setIsLoading,
      setOptions,
      state._contains,
      state._limit,
    ]
  );

  useEffect(() => {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    if (isOpen) {
      getData(source);
    }

    return () => source.cancel('Operation canceled by the user.');
  }, [getData, isOpen]);

  // const handleInputChange = (inputValue, { action }) => {
  //   if (action === 'input-change') {
  //     setState(prevState => {
  //       if (prevState._contains === inputValue) {
  //         return prevState;
  //       }

  //       return { ...prevState, _contains: inputValue, _start: 0 };
  //     });
  //   }

  //   return inputValue;
  // };

  // const handleMenuScrollToBottom = () => {
  //   setState(prevState => ({ ...prevState, _limit: prevState._limit + 20 }));
  // };

  // const handleMenuClose = () => {
  //   setState(initialPaginationState);
  //   setIsOpen(false);
  // };

  // const handleChange = value => {
  //   onChange({ target: { name, value: value ? value.value : value } });
  // };

  // const handleAddRelation = value => {
  //   if (!isEmpty(value)) {
  //     addRelation({ target: { name, value } });
  //   }
  // };

  // const handleMenuOpen = () => {
  //   setIsOpen(true);
  // };

  // const to = `/content-manager/collectionType/${targetModel}/${value ? value.id : null}`;

  // const searchToPersist = stringify(buildParams(query, paramsToKeep), { encode: false });

  // const link = useMemo(() => {
  //   if (!value) {
  //     return null;
  //   }

  //   if (!shouldDisplayRelationLink) {
  //     return null;
  //   }

  //   return (
  //     <Link to={{ pathname: to, state: { from: pathname }, search: searchToPersist }}>
  //       <FormattedMessage id="content-manager.containers.Edit.seeDetails">
  //         {msg => <A color="mediumBlue">{msg}</A>}
  //       </FormattedMessage>
  //     </Link>
  //   );
  // }, [shouldDisplayRelationLink, pathname, to, value, searchToPersist]);

  // const Component = isSingle ? SelectOne : SelectMany;
  const associationsLength = isArray(value) ? value.length : 0;

  // const isDisabled = useMemo(() => {
  //   if (isMorph) {
  //     return true;
  //   }

  //   if (!isCreatingEntry) {
  //     return (!isFieldAllowed && isFieldReadable) || !editable;
  //   }

  //   return !editable;
  // }, [isMorph, isCreatingEntry, editable, isFieldAllowed, isFieldReadable]);

  const multipleLabel = intlLabel.id
    ? formatMessage({ id: intlLabel.id, defaultMessage: intlLabel.defaultMessage })
    : name;
  const formattedLabel = isSingle
    ? intlLabel
    : {
        // Custom trad id in order to add the label count
        id: 'relations-label',
        defaultMessage: '{label} ({count})',
        values: { label: multipleLabel, count: associationsLength },
      };

  if (!isFieldAllowed && isCreatingEntry) {
    return <NotAllowedInput intlLabel={intlLabel} labelAction={labelAction} />;
  }

  if (!isCreatingEntry && !isFieldAllowed && !isFieldReadable) {
    return <NotAllowedInput intlLabel={intlLabel} labelAction={labelAction} />;
  }

  return (
    <ComingSoonInput
      intlLabel={formattedLabel}
      labelAction={labelAction}
      description={description}
      name={name}
    />
  );

  // return (
  //   <Padded>
  //     <BaselineAlignment />
  //     <Flex justifyContent="space-between">
  //       <Flex>
  //         <Text fontWeight="semiBold">
  //           <span>
  //             {label}
  //             {!isSingle && ` (${associationsLength})`}
  //           </span>
  //         </Text>
  //         {labelIconformatted && (
  //           <div style={{ lineHeight: '13px' }}>
  //             <LabelIconWrapper title={labelIconformatted.title}>
  //               {labelIconformatted.icon}
  //             </LabelIconWrapper>
  //           </div>
  //         )}
  //       </Flex>
  //       {isSingle && link}
  //     </Flex>
  //     {!isEmpty(description) && (
  //       <Padded top size="xs">
  //         <BaselineAlignment />
  //         <Text fontSize="sm" color="grey" lineHeight="12px" ellipsis>
  //           {description}
  //         </Text>
  //       </Padded>
  //     )}
  //     <Padded top size="sm">
  //       <BaselineAlignment />

  //       <Component
  //         addRelation={handleAddRelation}
  //         components={{ ClearIndicator, DropdownIndicator, IndicatorSeparator, Option }}
  //         displayNavigationLink={shouldDisplayRelationLink}
  //         id={name}
  //         isDisabled={isDisabled}
  //         isLoading={isLoading}
  //         isClearable
  //         mainField={mainField}
  //         move={moveRelation}
  //         name={name}
  //         options={filteredOptions}
  //         onChange={handleChange}
  //         onInputChange={handleInputChange}
  //         onMenuClose={handleMenuClose}
  //         onMenuOpen={handleMenuOpen}
  //         onMenuScrollToBottom={handleMenuScrollToBottom}
  //         onRemove={onRemoveRelation}
  //         placeholder={
  //           isEmpty(placeholder) ? (
  //             <FormattedMessage id={getTrad('containers.Edit.addAnItem')} />
  //           ) : (
  //             placeholder
  //           )
  //         }
  //         searchToPersist={searchToPersist}
  //         styles={styles}
  //         targetModel={targetModel}
  //         value={value}
  //       />
  //     </Padded>
  //     <div style={{ marginBottom: 28 }} />
  //   </Padded>
  // );
}

SelectWrapper.defaultProps = {
  // editable: true,
  description: '',
  labelAction: null,
  isFieldAllowed: true,
  // placeholder: null,
};

SelectWrapper.propTypes = {
  // editable: PropTypes.bool,
  description: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  }),
  intlLabel: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  }).isRequired,
  labelAction: PropTypes.element,
  isCreatingEntry: PropTypes.bool.isRequired,
  isFieldAllowed: PropTypes.bool,
  isFieldReadable: PropTypes.bool.isRequired,
  mainField: PropTypes.shape({
    name: PropTypes.string.isRequired,
    schema: PropTypes.shape({
      type: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  name: PropTypes.string.isRequired,
  // placeholder: PropTypes.shape({
  //   id: PropTypes.string.isRequired,
  //   defaultMessage: PropTypes.string.isRequired,
  //   values: PropTypes.object,
  // }),
  relationType: PropTypes.string.isRequired,
  // targetModel: PropTypes.string.isRequired,
  queryInfos: PropTypes.shape({
    containsKey: PropTypes.string.isRequired,
    defaultParams: PropTypes.object,
    endPoint: PropTypes.string.isRequired,
    shouldDisplayRelationLink: PropTypes.bool.isRequired,
    paramsToKeep: PropTypes.array,
  }).isRequired,
};

const Memoized = memo(SelectWrapper);

export default connect(Memoized, select);
