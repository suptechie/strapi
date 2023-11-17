import { useNotification } from '@strapi/helper-plugin';

import { getTrad } from '../utils';

import { CustomRadioGroup } from './CustomRadioGroup';

import type { IntlLabel } from '../types';

interface Radio {
  title: IntlLabel;
  description: IntlLabel;
  value: any;
}

interface ContentTypeRadioGroupProps {
  intlLabel: IntlLabel;
  name: string;
  onChange: (value: any) => void;
  radios?: Radio[];
  value?: string | boolean;
}

export const ContentTypeRadioGroup = ({ onChange, ...rest }: ContentTypeRadioGroupProps) => {
  const toggleNotification = useNotification();

  const handleChange = (e: any) => {
    toggleNotification({
      type: 'info',
      message: {
        id: getTrad('contentType.kind.change.warning'),
        defaultMessage:
          'You just changed the kind of a content type: API will be reset (routes, controllers, and services will be overwritten).',
      },
    });

    onChange(e);
  };

  return <CustomRadioGroup {...rest} onChange={handleChange} />;
};
