import React, { memo, useCallback, useMemo, useState } from 'react';
// import { get } from 'lodash';
import isEqual from 'react-fast-compare';
import PropTypes from 'prop-types';
import { Box } from '@strapi/parts/Box';
import { NotAllowedInput, useNotification } from '@strapi/helper-plugin';
import { getTrad } from '../../utils';
import connect from './utils/connect';
import select from './utils/select';
import AddComponentButton from './components/AddComponentButton';
import DzLabel from './components/DzLabel';
import Component from './components/Component';

import ComponentPicker from './components/ComponentPicker';

/* eslint-disable react/no-array-index-key */

const createCollapses = arrayLength =>
  Array.from({ length: arrayLength }).map(() => ({ isOpen: false }));

const DynamicZone = ({
  name,
  // Passed with the select function
  addComponentToDynamicZone,
  formErrors,
  isCreatingEntry,
  isFieldAllowed,
  isFieldReadable,
  labelAction,
  moveComponentUp,
  moveComponentDown,
  removeComponentFromDynamicZone,
  dynamicDisplayedComponents,
  fieldSchema,
  metadatas,
}) => {
  const toggleNotification = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dynamicDisplayedComponentsLength = dynamicDisplayedComponents.length;
  const [componentCollapses, setComponentsCollapses] = useState(
    createCollapses(dynamicDisplayedComponentsLength)
  );

  // We cannot use the default props here
  const {
    max = Infinity,
    // min = -Infinity
  } = fieldSchema;
  const dynamicZoneErrors = useMemo(() => {
    return Object.keys(formErrors)
      .filter(key => {
        return key === name;
      })
      .map(key => formErrors[key]);
  }, [formErrors, name]);

  const dynamicZoneAvailableComponents = useMemo(() => fieldSchema.components || [], [fieldSchema]);

  // FIXme
  // const missingComponentNumber = min - dynamicDisplayedComponentsLength;
  const hasError = dynamicZoneErrors.length > 0;
  // const hasMinError =
  //   dynamicZoneErrors.length > 0 && get(dynamicZoneErrors, [0, 'id'], '').includes('min');

  // const hasRequiredError = hasError && !hasMinError;
  // const hasMaxError =
  //   hasError && get(dynamicZoneErrors, [0, 'id'], '') === 'components.Input.error.validation.max';

  const handleAddComponent = useCallback(
    componentUid => {
      setIsOpen(false);

      addComponentToDynamicZone(name, componentUid, hasError);
      setComponentsCollapses(prev => [...prev, { isOpen: true }]);
    },
    [addComponentToDynamicZone, hasError, name]
  );

  const handleClickOpenPicker = () => {
    if (dynamicDisplayedComponentsLength < max) {
      setIsOpen(prev => !prev);
    } else {
      toggleNotification({
        type: 'info',
        message: { id: getTrad('components.notification.info.maximum-requirement') },
      });
    }
  };

  const handleToggleComponent = indexToToggle => {
    setComponentsCollapses(prev =>
      prev.map(({ isOpen }, index) => {
        if (index === indexToToggle) {
          return { isOpen: !isOpen };
        }

        return { isOpen };
      })
    );
  };

  const handleMoveComponentDown = (name, currentIndex) => {
    moveComponentDown(name, currentIndex);
    setComponentsCollapses(prev => {
      return prev.map(({ isOpen }, index, refArray) => {
        if (index === currentIndex + 1) {
          return { isOpen: refArray[currentIndex].isOpen };
        }

        if (index === currentIndex) {
          return { isOpen: refArray[index + 1].isOpen };
        }

        return { isOpen };
      });
    });
  };

  const handleMoveComponentUp = (name, currentIndex) => {
    moveComponentUp(name, currentIndex);
    setComponentsCollapses(prev => {
      return prev.map(({ isOpen }, index, refArray) => {
        if (index === currentIndex - 1) {
          return { isOpen: refArray[currentIndex].isOpen };
        }

        if (index === currentIndex) {
          return { isOpen: refArray[index - 1].isOpen };
        }

        return { isOpen };
      });
    });
  };

  const handleRemoveComponent = (name, currentIndex) => {
    removeComponentFromDynamicZone(name, currentIndex);

    setComponentsCollapses(prev => prev.filter((_, index) => index !== currentIndex));
  };

  if (!isFieldAllowed && isCreatingEntry) {
    return (
      <NotAllowedInput
        description={
          metadatas.description
            ? { id: metadatas.description, defaultMessage: metadatas.description }
            : null
        }
        intlLabel={{ id: metadatas.label, defaultMessage: metadatas.label }}
        labelAction={labelAction}
        name={name}
      />
    );
  }

  if (!isFieldAllowed && !isFieldReadable && !isCreatingEntry) {
    return (
      <NotAllowedInput
        description={
          metadatas.description
            ? { id: metadatas.description, defaultMessage: metadatas.description }
            : null
        }
        intlLabel={{ id: metadatas.label, defaultMessage: metadatas.label }}
        labelAction={labelAction}
        name={name}
      />
    );
  }

  return (
    <Box>
      {dynamicDisplayedComponentsLength > 0 && (
        <>
          <DzLabel
            label={metadatas.label}
            labelAction={labelAction}
            name={name}
            numberOfComponents={dynamicDisplayedComponentsLength}
          />
          {dynamicDisplayedComponents.map((componentUid, index) => {
            const showDownIcon =
              isFieldAllowed &&
              dynamicDisplayedComponentsLength > 0 &&
              index < dynamicDisplayedComponentsLength - 1;
            const showUpIcon = isFieldAllowed && dynamicDisplayedComponentsLength > 0 && index > 0;
            const isOpen = componentCollapses[index].isOpen;

            return (
              <Component
                componentUid={componentUid}
                key={index}
                index={index}
                isOpen={isOpen}
                isFieldAllowed={isFieldAllowed}
                moveComponentDown={handleMoveComponentDown}
                moveComponentUp={handleMoveComponentUp}
                onToggle={handleToggleComponent}
                name={name}
                removeComponentFromDynamicZone={handleRemoveComponent}
                showDownIcon={showDownIcon}
                showUpIcon={showUpIcon}
              />
            );
          })}
        </>
      )}
      {isFieldAllowed && (
        <>
          <AddComponentButton
            label={metadatas.label}
            isOpen={isOpen}
            name={name}
            onClick={handleClickOpenPicker}
          />
          <ComponentPicker
            isOpen={isOpen}
            components={dynamicZoneAvailableComponents}
            onClickAddComponent={handleAddComponent}
          />
        </>
      )}
    </Box>
  );

  // return (
  //   <DynamicZoneWrapper>
  //     {dynamicDisplayedComponentsLength > 0 && (
  //       <Label>
  //         <Flex>
  //           <p>
  //             <span>{metadatas.label}</span>
  //           </p>
  //           {formattedLabelIcon && (
  //             <LabelIconWrapper title={formattedLabelIcon.title}>
  //               {formattedLabelIcon.icon}
  //             </LabelIconWrapper>
  //           )}
  //         </Flex>
  //         <p>{metadatas.description}</p>
  //       </Label>
  //     )}

  //     {/* List of displayed components */}
  //     <ComponentWrapper>
  //       {dynamicDisplayedComponents.map((componentUid, index) => {
  //         const showDownIcon =
  //           isFieldAllowed &&
  //           dynamicDisplayedComponentsLength > 0 &&
  //           index < dynamicDisplayedComponentsLength - 1;
  //         const showUpIcon = isFieldAllowed && dynamicDisplayedComponentsLength > 0 && index > 0;

  //         return (
  //           <Component
  //             componentUid={componentUid}
  //             key={index}
  //             index={index}
  //             isFieldAllowed={isFieldAllowed}
  //             moveComponentDown={moveComponentDown}
  //             moveComponentUp={moveComponentUp}
  //             name={name}
  //             removeComponentFromDynamicZone={removeComponentFromDynamicZone}
  //             showDownIcon={showDownIcon}
  //             showUpIcon={showUpIcon}
  //           />
  //         );
  //       })}
  //     </ComponentWrapper>
  //     {isFieldAllowed ? (
  //       <Wrapper>
  //         <Button
  //           type="button"
  //           hasError={hasError}
  //           className={isOpen && 'isOpen'}
  //           onClick={handleClickOpenPicker}
  //         />
  //         {hasRequiredError && !isOpen && !hasMaxError && (
  //           <div className="error-label">
  //             <FormattedMessage id={getTrad('components.DynamicZone.required')} />
  //           </div>
  //         )}
  //         {hasMaxError && !isOpen && (
  //           <div className="error-label">
  //             <FormattedMessage id="components.Input.error.validation.max" />
  //           </div>
  //         )}
  //         {hasMinError && !isOpen && (
  //           <div className="error-label">
  //             <FormattedMessage
  //               id={getTrad(
  //                 `components.DynamicZone.missing${
  //                   missingComponentNumber > 1 ? '.plural' : '.singular'
  //                 }`
  //               )}
  //               values={{ count: missingComponentNumber }}
  //             />
  //           </div>
  //         )}
  //         <div className="info">
  //           <FormattedMessage
  //             id={getTrad('components.DynamicZone.add-compo')}
  //             values={{ componentName: metadatas.label }}
  //           />
  //         </div>
  //         <ComponentPicker
  //           isOpen={isOpen}
  //           components={dynamicZoneAvailableComponents}
  //           onClickAddComponent={handleAddComponent}
  //         />
  //       </Wrapper>
  //     ) : (
  //       <BaselineAlignement top="9px" />
  //     )}
  //   </DynamicZoneWrapper>
  // );
};

DynamicZone.defaultProps = {
  dynamicDisplayedComponents: [],
  fieldSchema: {
    max: Infinity,
    min: -Infinity,
  },
  labelAction: null,
};

DynamicZone.propTypes = {
  addComponentToDynamicZone: PropTypes.func.isRequired,
  dynamicDisplayedComponents: PropTypes.array,
  fieldSchema: PropTypes.shape({
    components: PropTypes.array.isRequired,
    max: PropTypes.number,
    min: PropTypes.number,
  }),
  formErrors: PropTypes.object.isRequired,
  isCreatingEntry: PropTypes.bool.isRequired,
  isFieldAllowed: PropTypes.bool.isRequired,
  isFieldReadable: PropTypes.bool.isRequired,
  labelAction: PropTypes.element,
  metadatas: PropTypes.shape({
    description: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
  moveComponentUp: PropTypes.func.isRequired,
  moveComponentDown: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  removeComponentFromDynamicZone: PropTypes.func.isRequired,
};

const Memoized = memo(DynamicZone, isEqual);

export default connect(Memoized, select);

export { DynamicZone };
