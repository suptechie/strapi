import React, { memo, useCallback, useMemo, useState } from 'react';
/* eslint-disable import/no-cycle */
import { useDrop } from 'react-dnd';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import get from 'lodash/get';
import take from 'lodash/take';
// import { FormattedMessage } from 'react-intl';
import { useNotification } from '@strapi/helper-plugin';
import { Box } from '@strapi/design-system/Box';
import { Flex } from '@strapi/design-system/Flex';
import { TextButton } from '@strapi/design-system/TextButton';
import Plus from '@strapi/icons/Plus';
// import { ErrorMessage } from '@buffetjs/styles';
import { getMaxTempKey, getTrad } from '../../utils';
import { useContentTypeLayout } from '../../hooks';
import ItemTypes from '../../utils/ItemTypes';
import ComponentInitializer from '../ComponentInitializer';
import connect from './utils/connect';
import select from './utils/select';
import DraggedItem from './DraggedItem';
import AccordionGroupCustom from './AccordionGroupCustom';

const TextButtonCustom = styled(TextButton)`
  height: 100%;
  width: 100%;
  border-radius: 0 0 4px 4px;
  display: flex;
  justify-content: center;
  span {
    font-weight: 600;
    font-size: 14px;
  }
`;

const RepeatableComponent = ({
  addRepeatableComponentToField,
  formErrors,
  componentUid,
  componentValue,
  componentValueLength,
  isNested,
  isReadOnly,
  max,
  // min,
  name,
}) => {
  const toggleNotification = useNotification();
  const { formatMessage } = useIntl();
  const [collapseToOpen, setCollapseToOpen] = useState('');
  const [isDraggingSibling, setIsDraggingSiblig] = useState(false);
  const [, drop] = useDrop({ accept: ItemTypes.COMPONENT });
  const { getComponentLayout } = useContentTypeLayout();
  const componentLayoutData = useMemo(() => getComponentLayout(componentUid), [
    componentUid,
    getComponentLayout,
  ]);

  const nextTempKey = useMemo(() => {
    return getMaxTempKey(componentValue || []) + 1;
  }, [componentValue]);

  const componentErrorKeys = Object.keys(formErrors)
    .filter(errorKey => {
      return take(errorKey.split('.'), isNested ? 3 : 1).join('.') === name;
    })
    .map(errorKey => {
      return errorKey
        .split('.')
        .slice(0, name.split('.').length + 1)
        .join('.');
    });

  const toggleCollapses = () => {
    setCollapseToOpen('');
  };
  // TODO
  // const missingComponentsValue = min - componentValueLength;
  const errorsArray = componentErrorKeys.map(key => get(formErrors, [key, 'id'], ''));

  const hasMinError = get(errorsArray, [0], '').includes('min');

  const handleClick = useCallback(() => {
    if (!isReadOnly) {
      if (componentValueLength < max) {
        const shouldCheckErrors = hasMinError;

        addRepeatableComponentToField(name, componentUid, shouldCheckErrors);

        setCollapseToOpen(nextTempKey);
      } else if (componentValueLength >= max) {
        toggleNotification({
          type: 'info',
          message: { id: getTrad('components.notification.info.maximum-requirement') },
        });
      }
    }
  }, [
    addRepeatableComponentToField,
    componentUid,
    componentValueLength,
    hasMinError,
    isReadOnly,
    max,
    name,
    nextTempKey,
    toggleNotification,
  ]);

  if (componentValueLength === 0) {
    return <ComponentInitializer isReadOnly={isReadOnly} onClick={handleClick} />;
  }

  return (
    <Box hasRadius background="neutral0" shadow="tableShadow" ref={drop}>
      <AccordionGroupCustom
        footer={
          <Flex justifyContent="center" height="48px" background="neutral0" hasRadius>
            <TextButtonCustom disabled={isReadOnly} onClick={handleClick} startIcon={<Plus />}>
              {formatMessage({
                id: getTrad('containers.EditView.add.new-entry'),
                defaultMessage: 'Add an entry',
              })}
            </TextButtonCustom>
          </Flex>
        }
      >
        {componentValue.map((data, index) => {
          const key = data.__temp_key__;
          const isOpen = collapseToOpen === key;
          const componentFieldName = `${name}.${index}`;
          const previousComponentTempKey = get(componentValue, [index - 1, '__temp_key__']);
          const doesPreviousFieldContainErrorsAndIsOpen =
            componentErrorKeys.includes(`${name}.${index - 1}`) &&
            index !== 0 &&
            collapseToOpen === previousComponentTempKey;

          const hasErrors = componentErrorKeys.includes(componentFieldName);

          return (
            <DraggedItem
              componentFieldName={componentFieldName}
              componentUid={componentUid}
              // TODO
              doesPreviousFieldContainErrorsAndIsOpen={doesPreviousFieldContainErrorsAndIsOpen}
              hasErrors={hasErrors}
              hasMinError={hasMinError}
              isDraggingSibling={isDraggingSibling}
              isFirst={index === 0}
              isOpen={isOpen}
              isReadOnly={isReadOnly}
              key={key}
              onClickToggle={() => {
                if (isOpen) {
                  setCollapseToOpen('');
                } else {
                  setCollapseToOpen(key);
                }
              }}
              parentName={name}
              schema={componentLayoutData}
              setIsDraggingSiblig={setIsDraggingSiblig}
              toggleCollapses={toggleCollapses}
            />
          );
        })}
      </AccordionGroupCustom>
    </Box>
    // <Box hasRadius borderColor="neutral200">
    //   <Box ref={drop}>
    //     {componentValue.map((data, index) => {
    //       const key = data.__temp_key__;
    //       const isOpen = collapseToOpen === key;
    //       const componentFieldName = `${name}.${index}`;
    //       const previousComponentTempKey = get(componentValue, [index - 1, '__temp_key__']);
    //       const doesPreviousFieldContainErrorsAndIsOpen =
    //         componentErrorKeys.includes(`${name}.${index - 1}`) &&
    //         index !== 0 &&
    //         collapseToOpen === previousComponentTempKey;

    //       const hasErrors = componentErrorKeys.includes(componentFieldName);

    //       return (
    //         <DraggedItem
    //           componentFieldName={componentFieldName}
    //           componentUid={componentUid}
    //           // TODO
    //           doesPreviousFieldContainErrorsAndIsOpen={doesPreviousFieldContainErrorsAndIsOpen}
    //           hasErrors={hasErrors}
    //           hasMinError={hasMinError}
    //           isFirst={index === 0}
    //           isOdd={index % 2 === 1}
    //           isOpen={isOpen}
    //           isReadOnly={isReadOnly}
    //           key={key}
    //           onClickToggle={() => {
    //             if (isOpen) {
    //               setCollapseToOpen('');
    //             } else {
    //               setCollapseToOpen(key);
    //             }
    //           }}
    //           parentName={name}
    //           schema={componentLayoutData}
    //           toggleCollapses={toggleCollapses}
    //         />
    //       );
    //     })}
    //   </Box>
    //   <Button
    //     // TODO
    //     // hasMinError={hasMinError}
    //     disabled={isReadOnly}
    //     // TODO
    //     // doesPreviousFieldContainErrorsAndIsClosed={
    //     //   componentValueLength > 0 &&
    //     //   componentErrorKeys.includes(`${name}.${componentValueLength - 1}`) &&
    //     //   componentValue[componentValueLength - 1].__temp_key__ !== collapseToOpen
    //     // }
    //     onClick={handleClick}
    //   />
    // </Box>
  );

  // return (
  //   <div>
  //     {componentValueLength === 0 && (
  //       <EmptyComponent hasMinError={hasMinError}>
  //         <FormattedMessage id={getTrad('components.empty-repeatable')}>
  //           {msg => <p>{msg}</p>}
  //         </FormattedMessage>
  //       </EmptyComponent>
  //     )}
  //     <div ref={drop}>
  //       {componentValueLength > 0 &&
  //         componentValue.map((data, index) => {
  //           const key = data.__temp_key__;
  //           const isOpen = collapseToOpen === key;
  //           const componentFieldName = `${name}.${index}`;
  //           const previousComponentTempKey = get(componentValue, [index - 1, '__temp_key__']);
  //           const doesPreviousFieldContainErrorsAndIsOpen =
  //             componentErrorKeys.includes(`${name}.${index - 1}`) &&
  //             index !== 0 &&
  //             collapseToOpen === previousComponentTempKey;

  //           const hasErrors = componentErrorKeys.includes(componentFieldName);

  //           return (
  //             <DraggedItem
  //               componentFieldName={componentFieldName}
  //               componentUid={componentUid}
  //               doesPreviousFieldContainErrorsAndIsOpen={doesPreviousFieldContainErrorsAndIsOpen}
  //               hasErrors={hasErrors}
  //               hasMinError={hasMinError}
  //               isFirst={index === 0}
  //               isReadOnly={isReadOnly}
  //               isOpen={isOpen}
  //               key={key}
  //               onClickToggle={() => {
  //                 if (isOpen) {
  //                   setCollapseToOpen('');
  //                 } else {
  //                   setCollapseToOpen(key);
  //                 }
  //               }}
  //               parentName={name}
  //               schema={componentLayoutData}
  //               toggleCollapses={toggleCollapses}
  //             />
  //           );
  //         })}
  //     </div>
  //     <Button
  //       hasMinError={hasMinError}
  //       disabled={isReadOnly}
  //       withBorderRadius={false}
  //       doesPreviousFieldContainErrorsAndIsClosed={
  //         componentValueLength > 0 &&
  //         componentErrorKeys.includes(`${name}.${componentValueLength - 1}`) &&
  //         componentValue[componentValueLength - 1].__temp_key__ !== collapseToOpen
  //       }
  //       type="button"
  //       onClick={handleClick}
  //     >
  //       <i className="fa fa-plus" />
  //       <FormattedMessage id={getTrad('containers.EditView.add.new')} />
  //     </Button>
  //     {hasMinError && (
  //       <ErrorMessage>
  //         <FormattedMessage
  //           id={getTrad(
  //             `components.DynamicZone.missing${
  //               missingComponentsValue > 1 ? '.plural' : '.singular'
  //             }`
  //           )}
  //           values={{ count: missingComponentsValue }}
  //         />
  //       </ErrorMessage>
  //     )}
  //   </div>
  // );
};

RepeatableComponent.defaultProps = {
  componentValue: null,
  componentValueLength: 0,
  formErrors: {},
  isNested: false,
  max: Infinity,
  // min: -Infinity,
};

RepeatableComponent.propTypes = {
  addRepeatableComponentToField: PropTypes.func.isRequired,
  componentUid: PropTypes.string.isRequired,
  componentValue: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  componentValueLength: PropTypes.number,
  formErrors: PropTypes.object,
  isNested: PropTypes.bool,
  isReadOnly: PropTypes.bool.isRequired,
  max: PropTypes.number,
  // min: PropTypes.number,
  name: PropTypes.string.isRequired,
};

const Memoized = memo(RepeatableComponent);

export default connect(
  Memoized,
  select
);

export { RepeatableComponent };
