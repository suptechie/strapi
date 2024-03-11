import { forwardRef } from 'react';

import { TextInput, useComposedRefs } from '@strapi/design-system';
import { useFocusInputField } from '@strapi/helper-plugin';

import { type InputProps, useField } from '../Form';

/**
 * TODO: fix the ref type when the design system is fixed.
 */
export const StringInput = forwardRef<any, InputProps>(
  ({ disabled, label, hint, name, placeholder, required }, ref) => {
    const field = useField(name);
    const fieldRef = useFocusInputField(name);

    const composedRefs = useComposedRefs(ref, fieldRef);

    return (
      <TextInput
        ref={composedRefs}
        disabled={disabled}
        hint={hint}
        // @ts-expect-error – label _could_ be a ReactNode since it's a child, this should be fixed in the DS.
        label={label}
        name={name}
        error={field.error}
        defaultValue={field.initialValue}
        onChange={field.onChange}
        placeholder={placeholder}
        required={required}
        value={field.value ?? ''}
      />
    );
  }
);
