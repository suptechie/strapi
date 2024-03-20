import { forwardRef } from 'react';

import { DateTimePicker, useComposedRefs } from '@strapi/design-system';
import { useIntl } from 'react-intl';

import { useFocusInputField } from '../../hooks/useFocusInputField';
import { useField } from '../Form';

import { InputProps } from './types';

const DateTimeInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { formatMessage } = useIntl();
  const field = useField<Date>(props.name);
  const fieldRef = useFocusInputField(props.name);

  const composedRefs = useComposedRefs<HTMLInputElement | null>(ref, fieldRef);
  const value = typeof field.value === 'string' ? new Date(field.value) : field.value;

  return (
    // @ts-expect-error – label _could_ be a ReactNode since it's a child, this should be fixed in the DS.
    <DateTimePicker
      ref={composedRefs}
      clearLabel={formatMessage({ id: 'clearLabel', defaultMessage: 'Clear' })}
      error={field.error}
      id={props.name}
      onChange={(date) => {
        field.onChange(props.name, date);
      }}
      onClear={() => field.onChange(props.name, undefined)}
      value={value}
      {...props}
    />
  );
});

export { DateTimeInput };
