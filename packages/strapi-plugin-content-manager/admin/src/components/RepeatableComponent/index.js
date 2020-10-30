/* eslint-disable import/no-cycle */
import React, { memo, useMemo, useState } from 'react';
import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import { get, take } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { ErrorMessage } from '@buffetjs/styles';
import pluginId from '../../pluginId';
import { useContentTypeLayout } from '../../hooks';
import ItemTypes from '../../utils/ItemTypes';
import connect from './utils/connect';
import select from './utils/select';
import Button from './AddFieldButton';
import DraggedItem from './DraggedItem';
import EmptyComponent from './EmptyComponent';

const getMax = arr => {
  if (arr.length === 0) {
    return -1;
  }

  return Math.max.apply(
    Math,
    arr.map(o => o.__temp_key__)
  );
};

const RepeatableComponent = ({
  addRepeatableComponentToField,
  formErrors,
  componentUid,
  componentValue,
  componentValueLength,
  isNested,
  isReadOnly,
  max,
  min,
  name,
}) => {
  const [collapseToOpen, setCollapseToOpen] = useState('');
  const [, drop] = useDrop({ accept: ItemTypes.COMPONENT });
  const { getComponentLayout } = useContentTypeLayout();
  const componentLayoutData = useMemo(() => getComponentLayout(componentUid), [
    componentUid,
    getComponentLayout,
  ]);

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
  const missingComponentsValue = min - componentValueLength;
  const errorsArray = componentErrorKeys.map(key => get(formErrors, [key, 'id'], ''));

  const hasMinError = get(errorsArray, [0], '').includes('min');

  return (
    <div>
      {componentValueLength === 0 && (
        <EmptyComponent hasMinError={hasMinError}>
          <FormattedMessage id={`${pluginId}.components.empty-repeatable`}>
            {msg => <p>{msg}</p>}
          </FormattedMessage>
        </EmptyComponent>
      )}
      <div ref={drop}>
        {componentValueLength > 0 &&
          componentValue.map((data, index) => {
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
                doesPreviousFieldContainErrorsAndIsOpen={doesPreviousFieldContainErrorsAndIsOpen}
                hasErrors={hasErrors}
                hasMinError={hasMinError}
                isFirst={index === 0}
                isReadOnly={isReadOnly}
                isOpen={isOpen}
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
                toggleCollapses={toggleCollapses}
              />
            );
          })}
      </div>
      <Button
        hasMinError={hasMinError}
        disabled={isReadOnly}
        withBorderRadius={false}
        doesPreviousFieldContainErrorsAndIsClosed={
          componentValueLength > 0 &&
          componentErrorKeys.includes(`${name}.${componentValueLength - 1}`) &&
          componentValue[componentValueLength - 1].__temp_key__ !== collapseToOpen
        }
        type="button"
        onClick={() => {
          if (!isReadOnly) {
            if (componentValueLength < max) {
              const shouldCheckErrors = hasMinError;

              addRepeatableComponentToField(name, componentUid, shouldCheckErrors);

              setCollapseToOpen(getMax(componentValue) + 1);
            } else if (componentValueLength >= max) {
              strapi.notification.info(
                `${pluginId}.components.notification.info.maximum-requirement`
              );
            }
          }
        }}
      >
        <i className="fa fa-plus" />
        <FormattedMessage id={`${pluginId}.containers.EditView.add.new`} />
      </Button>
      {hasMinError && (
        <ErrorMessage>
          <FormattedMessage
            id={`${pluginId}.components.DynamicZone.missing${
              missingComponentsValue > 1 ? '.plural' : '.singular'
            }`}
            values={{ count: missingComponentsValue }}
          />
        </ErrorMessage>
      )}
    </div>
  );
};

RepeatableComponent.defaultProps = {
  componentValue: null,
  componentValueLength: 0,
  formErrors: {},
  isNested: false,
  max: Infinity,
  min: -Infinity,
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
  min: PropTypes.number,
  name: PropTypes.string.isRequired,
};

const Memoized = memo(RepeatableComponent);

export default connect(Memoized, select);

export { RepeatableComponent };
