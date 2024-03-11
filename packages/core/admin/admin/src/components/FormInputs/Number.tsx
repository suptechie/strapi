import { forwardRef } from 'react';

import { NumberInput, useComposedRefs } from '@strapi/design-system';
import { useFocusInputField } from '@strapi/helper-plugin';

import { useField } from '../Form';

import { InputProps } from './types';

const NumberInputImpl = forwardRef<HTMLInputElement, InputProps>(
  ({ disabled, label, hint, name, required, placeholder, type }, ref) => {
    const field = useField<number>(name);
    const fieldRef = useFocusInputField(name);

    const composedRefs = useComposedRefs<HTMLInputElement | null>(ref, fieldRef);

    return (
      <NumberInput
        ref={composedRefs}
        defaultValue={field.initialValue}
        disabled={disabled}
        error={field.error}
        // @ts-expect-error – label _could_ be a ReactNode since it's a child, this should be fixed in the DS.
        label={label}
        id={name}
        hint={hint}
        name={name}
        onValueChange={(value) => {
          field.onChange(name, value);
        }}
        placeholder={placeholder}
        required={required}
        step={type === 'float' || type == 'decimal' ? 0.01 : 1}
        value={field.value}
      />
    );
  }
);

export { NumberInputImpl as NumberInput };
