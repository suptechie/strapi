import * as React from 'react';

import { Box, Flex, VisuallyHidden } from '@strapi/design-system';
import { useNotification } from '@strapi/helper-plugin';
import pipe from 'lodash/fp/pipe';
import { useIntl } from 'react-intl';

import { createContext } from '../../../../../../components/Context';
import { InputProps, useField, useForm } from '../../../../../components/Form';
import { useDoc } from '../../../../../hooks/useDocument';
import { type EditFieldLayout } from '../../../../../hooks/useDocumentLayout';
import { getTranslation } from '../../../../../utils/translations';
import { transformDocument } from '../../../utils/data';
import { createDefaultForm } from '../../../utils/forms';

import { AddComponentButton } from './AddComponentButton';
import { ComponentPicker } from './ComponentPicker';
import { DynamicComponent, DynamicComponentProps } from './DynamicComponent';
import { DynamicZoneLabel } from './DynamicZoneLabel';

import type { Attribute } from '@strapi/types';

interface DynamicZoneContextValue {
  isInDynamicZone: boolean;
}

const [DynamicZoneProvider, useDynamicZone] = createContext<DynamicZoneContextValue>(
  'DynamicZone',
  {
    isInDynamicZone: false,
  }
);

interface DynamicZoneProps
  extends Omit<Extract<EditFieldLayout, { type: 'dynamiczone' }>, 'size' | 'hint'>,
    Pick<InputProps, 'hint'> {}

const DynamicZone = ({
  attribute,
  disabled,
  hint,
  label,
  name,
  required = false,
}: DynamicZoneProps) => {
  // We cannot use the default props here
  const { max = Infinity, min = -Infinity } = attribute ?? {};

  const [addComponentIsOpen, setAddComponentIsOpen] = React.useState(false);
  const [liveText, setLiveText] = React.useState('');
  const { components } = useDoc();
  const { addFieldRow, removeFieldRow, moveFieldRow } = useForm(
    'DynamicZone',
    ({ addFieldRow, removeFieldRow, moveFieldRow }) => ({
      addFieldRow,
      removeFieldRow,
      moveFieldRow,
    })
  );

  const { value = [] } =
    useField<Array<Attribute.GetValue<Attribute.DynamicZone>[number] & { __temp_key__: number }>>(
      name
    );

  const dynamicComponentsByCategory = React.useMemo(() => {
    return attribute.components.reduce<
      NonNullable<DynamicComponentProps['dynamicComponentsByCategory']>
    >((acc, componentUid) => {
      const { category, info } = components[componentUid] ?? { info: {} };

      const component = { uid: componentUid, displayName: info.displayName, icon: info.icon };

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category] = [...acc[category], component];

      return acc;
    }, {});
  }, [attribute.components, components]);

  const { formatMessage } = useIntl();

  const toggleNotification = useNotification();

  const dynamicDisplayedComponentsLength = value.length;

  const handleAddComponent = (uid: string, position?: number) => {
    setAddComponentIsOpen(false);

    const schema = components[uid];
    const form = createDefaultForm(schema, components);
    const transformations = pipe(transformDocument(schema, components), (data) => ({
      ...data,
      __component: uid,
    }));

    const data = transformations(form);

    addFieldRow(name, data, position);
  };

  const handleClickOpenPicker = () => {
    if (dynamicDisplayedComponentsLength < max) {
      setAddComponentIsOpen((prev) => !prev);
    } else {
      toggleNotification({
        type: 'info',
        message: { id: getTranslation('components.notification.info.maximum-requirement') },
      });
    }
  };

  const handleMoveComponent = (newIndex: number, currentIndex: number) => {
    setLiveText(
      formatMessage(
        {
          id: getTranslation('dnd.reorder'),
          defaultMessage: '{item}, moved. New position in list: {position}.',
        },
        {
          item: `${name}.${currentIndex}`,
          position: getItemPos(newIndex),
        }
      )
    );

    moveFieldRow(name, currentIndex, newIndex);
  };

  const getItemPos = (index: number) => `${index + 1} of ${value.length}`;

  const handleCancel = (index: number) => {
    setLiveText(
      formatMessage(
        {
          id: getTranslation('dnd.cancel-item'),
          defaultMessage: '{item}, dropped. Re-order cancelled.',
        },
        {
          item: `${name}.${index}`,
        }
      )
    );
  };

  const handleGrabItem = (index: number) => {
    setLiveText(
      formatMessage(
        {
          id: getTranslation('dnd.grab-item'),
          defaultMessage: `{item}, grabbed. Current position in list: {position}. Press up and down arrow to change position, Spacebar to drop, Escape to cancel.`,
        },
        {
          item: `${name}.${index}`,
          position: getItemPos(index),
        }
      )
    );
  };

  const handleDropItem = (index: number) => {
    setLiveText(
      formatMessage(
        {
          id: getTranslation('dnd.drop-item'),
          defaultMessage: `{item}, dropped. Final position in list: {position}.`,
        },
        {
          item: `${name}.${index}`,
          position: getItemPos(index),
        }
      )
    );
  };

  const handleRemoveComponent = (name: string, currentIndex: number) => () => {
    removeFieldRow(name, currentIndex);
  };

  const renderButtonLabel = () => {
    if (addComponentIsOpen) {
      return formatMessage({ id: 'app.utils.close-label', defaultMessage: 'Close' });
    }

    // if (hasError && dynamicZoneError.id?.includes('max')) {
    //   return formatMessage({
    //     id: 'components.Input.error.validation.max',
    //     defaultMessage: 'The value is too high.',
    //   });
    // }

    // if (hasError && dynamicZoneError.id?.includes('min')) {
    //   return formatMessage(
    //     {
    //       id: getTranslation(`components.DynamicZone.missing-components`),
    //       defaultMessage:
    //         'There {number, plural, =0 {are # missing components} one {is # missing component} other {are # missing components}}',
    //     },
    //     { number: missingComponentNumber }
    //   );
    // }

    return formatMessage(
      {
        id: getTranslation('components.DynamicZone.add-component'),
        defaultMessage: 'Add a component to {componentName}',
      },
      { componentName: label || name }
    );
  };

  const ariaDescriptionId = React.useId();

  return (
    <DynamicZoneProvider isInDynamicZone>
      <Flex direction="column" alignItems="stretch" gap={6}>
        {dynamicDisplayedComponentsLength > 0 && (
          <Box>
            <DynamicZoneLabel
              hint={hint}
              label={label}
              // labelAction={labelAction}
              name={name}
              numberOfComponents={dynamicDisplayedComponentsLength}
              required={required}
            />
            <VisuallyHidden id={ariaDescriptionId}>
              {formatMessage({
                id: getTranslation('dnd.instructions'),
                defaultMessage: `Press spacebar to grab and re-order`,
              })}
            </VisuallyHidden>
            <VisuallyHidden aria-live="assertive">{liveText}</VisuallyHidden>
            <ol aria-describedby={ariaDescriptionId}>
              {value.map((field, index) => (
                <DynamicComponent
                  key={field.__temp_key__}
                  disabled={disabled}
                  name={name}
                  index={index}
                  componentUid={field.__component}
                  onMoveComponent={handleMoveComponent}
                  onRemoveComponentClick={handleRemoveComponent(name, index)}
                  onCancel={handleCancel}
                  onDropItem={handleDropItem}
                  onGrabItem={handleGrabItem}
                  onAddComponent={handleAddComponent}
                  dynamicComponentsByCategory={dynamicComponentsByCategory}
                />
              ))}
            </ol>
          </Box>
        )}
        <Flex justifyContent="center">
          <AddComponentButton
            // hasError={hasError}
            isDisabled={disabled}
            isOpen={addComponentIsOpen}
            onClick={handleClickOpenPicker}
          >
            {renderButtonLabel()}
          </AddComponentButton>
        </Flex>
        <ComponentPicker
          dynamicComponentsByCategory={dynamicComponentsByCategory}
          isOpen={addComponentIsOpen}
          onClickAddComponent={handleAddComponent}
        />
      </Flex>
    </DynamicZoneProvider>
  );
};

export { DynamicZone, useDynamicZone };
export type { DynamicZoneProps };
