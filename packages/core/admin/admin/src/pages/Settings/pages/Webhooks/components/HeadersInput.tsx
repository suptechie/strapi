import * as React from 'react';

import {
  Box,
  Flex,
  Grid,
  GridItem,
  TextButton,
  ComboboxOption,
  Combobox,
  ComboboxProps,
  IconButton,
  Field as DSField,
} from '@strapi/design-system';
import { Minus, Plus } from '@strapi/icons';
import { useIntl } from 'react-intl';

import { useField, useForm } from '../../../../../components/Form';
import { StringInput } from '../../../../../components/FormInputs/String';

/* -------------------------------------------------------------------------------------------------
 * HeadersInput
 * -----------------------------------------------------------------------------------------------*/

interface Header {
  key: HTTPHeaders;
  value: string;
}

const HeadersInput = () => {
  const { formatMessage } = useIntl();

  const addFieldRow = useForm('HeadersInput', (state) => state.addFieldRow);
  const removeFieldRow = useForm('HeadersInput', (state) => state.removeFieldRow);
  const { value = [] } = useField<Header[]>('headers');

  return (
    <Flex direction="column" alignItems="stretch" gap={1}>
      <DSField.Label>
        {formatMessage({
          id: 'Settings.webhooks.form.headers',
          defaultMessage: 'Headers',
        })}
      </DSField.Label>
      <Box padding={8} background="neutral100" hasRadius>
        {value.map((_, index) => {
          return (
            <Grid key={index} gap={4}>
              <GridItem col={6}>
                <HeaderCombobox
                  name={`headers.${index}.key`}
                  aria-label={`row ${index + 1} key`}
                  label={formatMessage({
                    id: 'Settings.webhooks.key',
                    defaultMessage: 'Key',
                  })}
                />
              </GridItem>
              <GridItem col={6}>
                <Flex alignItems="flex-end" gap={2}>
                  <Box style={{ flex: 1 }}>
                    <StringInput
                      name={`headers.${index}.value`}
                      aria-label={`row ${index + 1} value`}
                      label={formatMessage({
                        id: 'Settings.webhooks.value',
                        defaultMessage: 'Value',
                      })}
                      type="string"
                    />
                  </Box>
                  <Flex paddingTop={6} style={{ alignSelf: 'flex-start' }}>
                    <IconButton
                      borderRadius="3rem"
                      width="2rem"
                      height="2rem"
                      padding="0.4rem"
                      alignItems="center"
                      justifyContent="center"
                      disabled={value.length === 1}
                      onClick={() => removeFieldRow('headers', index)}
                      color="primary600"
                      label={formatMessage(
                        {
                          id: 'Settings.webhooks.headers.remove',
                          defaultMessage: 'Remove header row {number}',
                        },
                        { number: index + 1 }
                      )}
                    >
                      <Minus width="0.8rem" />
                    </IconButton>
                  </Flex>
                </Flex>
              </GridItem>
              <GridItem col={12}>
                <TextButton
                  type="button"
                  onClick={() => {
                    addFieldRow('headers', { key: '', value: '' });
                  }}
                  startIcon={<Plus />}
                >
                  {formatMessage({
                    id: 'Settings.webhooks.create.header',
                    defaultMessage: 'Create new header',
                  })}
                </TextButton>
              </GridItem>
            </Grid>
          );
        })}
      </Box>
    </Flex>
  );
};

/* -------------------------------------------------------------------------------------------------
 * HeaderCombobox
 * -----------------------------------------------------------------------------------------------*/

interface HeaderComboboxProps extends Omit<ComboboxProps, 'children' | 'name'> {
  name: string;
  label: string;
}

const HeaderCombobox = ({ name, label, ...restProps }: HeaderComboboxProps) => {
  const [options, setOptions] = React.useState<HTTPHeaders[]>([...HTTP_HEADERS]);
  const { value: headers } = useField<Header[]>('headers');
  const field = useField(name);

  React.useEffect(() => {
    const headerOptions = HTTP_HEADERS.filter(
      (key) => !headers?.some((header) => header.key !== field.value && header.key === key)
    );

    setOptions(headerOptions);
  }, [headers, field.value]);

  const handleChange: ComboboxProps['onChange'] = (value) => {
    field.onChange(name, value);
  };

  const handleCreateOption = (value: string) => {
    setOptions((prev) => [...prev, value as HTTPHeaders]);

    handleChange(value);
  };

  return (
    <DSField.Root name={name} error={field.error}>
      <DSField.Label>{label}</DSField.Label>
      <Combobox
        {...restProps}
        onClear={() => handleChange('')}
        onChange={handleChange}
        onCreateOption={handleCreateOption}
        placeholder=""
        creatable
        value={field.value}
      >
        {options.map((key) => (
          <ComboboxOption value={key} key={key}>
            {key}
          </ComboboxOption>
        ))}
      </Combobox>
      <DSField.Error />
    </DSField.Root>
  );
};

const HTTP_HEADERS = [
  'A-IM',
  'Accept',
  'Accept-Charset',
  'Accept-Encoding',
  'Accept-Language',
  'Accept-Datetime',
  'Access-Control-Request-Method',
  'Access-Control-Request-Headers',
  'Authorization',
  'Cache-Control',
  'Connection',
  'Content-Length',
  'Content-Type',
  'Cookie',
  'Date',
  'Expect',
  'Forwarded',
  'From',
  'Host',
  'If-Match',
  'If-Modified-Since',
  'If-None-Match',
  'If-Range',
  'If-Unmodified-Since',
  'Max-Forwards',
  'Origin',
  'Pragma',
  'Proxy-Authorization',
  'Range',
  'Referer',
  'TE',
  'User-Agent',
  'Upgrade',
  'Via',
  'Warning',
] as const;

type HTTPHeaders = (typeof HTTP_HEADERS)[number];

export { HeadersInput };
