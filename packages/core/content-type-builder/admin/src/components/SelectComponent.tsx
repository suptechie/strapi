import { SingleSelectOption, SingleSelect, Field } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { useDataManager } from '../hooks/useDataManager';

interface Option {
  uid: string;
  label: string;
  categoryName: string;
}

interface SelectComponentProps {
  componentToCreate?: Record<string, any> | null;
  error?: string | null;
  intlLabel: {
    id: string;
    defaultMessage: string;
    values?: Record<string, any>;
  };
  isAddingAComponentToAnotherComponent: boolean;
  isCreating: boolean;
  isCreatingComponentWhileAddingAField: boolean;
  name: string;
  onChange: (value: any) => void;
  targetUid: string;
  value: string;
  forTarget: string;
}

export const SelectComponent = ({
  error = null,
  intlLabel,
  isAddingAComponentToAnotherComponent,
  isCreating,
  isCreatingComponentWhileAddingAField,
  componentToCreate,
  name,
  onChange,
  targetUid,
  forTarget,
  value,
}: SelectComponentProps) => {
  const { formatMessage } = useIntl();
  const errorMessage = error ? formatMessage({ id: error, defaultMessage: error }) : '';
  const label = formatMessage(intlLabel);

  const { componentsGroupedByCategory, componentsThatHaveOtherComponentInTheirAttributes } =
    useDataManager();

  const isTargetAComponent = ['component', 'components'].includes(forTarget);

  let options: Option[] = Object.entries(componentsGroupedByCategory).reduce(
    (acc: Option[], current) => {
      const [categoryName, components] = current;
      const compos = components.map((component) => {
        return {
          uid: component.uid,
          label: component.schema.displayName,
          categoryName,
        };
      });

      return [...acc, ...compos];
    },
    []
  );

  if (isAddingAComponentToAnotherComponent) {
    options = options.filter((option) => {
      return !componentsThatHaveOtherComponentInTheirAttributes.includes(option.uid);
    });
  }

  if (isTargetAComponent) {
    options = options.filter((option) => {
      return option.uid !== targetUid;
    });
  }

  if (isCreatingComponentWhileAddingAField) {
    options = [
      {
        uid: value,
        label: componentToCreate?.displayName,
        categoryName: componentToCreate?.category,
      },
    ];
  }

  return (
    <Field.Root error={errorMessage} name={name}>
      <Field.Label>{label}</Field.Label>
      <SingleSelect
        disabled={isCreatingComponentWhileAddingAField || !isCreating}
        onChange={(value: any) => {
          onChange({ target: { name, value, type: 'select-category' } });
        }}
        value={value || ''}
      >
        {options.map((option) => {
          return (
            <SingleSelectOption key={option.uid} value={option.uid}>
              {`${option.categoryName} - ${option.label}`}
            </SingleSelectOption>
          );
        })}
      </SingleSelect>
      <Field.Error />
    </Field.Root>
  );
};
