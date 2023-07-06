import React from 'react';

import { Box, Divider, Flex, Option, Select, Typography } from '@strapi/design-system';
import get from 'lodash/get';
import PropTypes from 'prop-types';
import { stringify } from 'qs';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';

import { getTrad } from '../../../utils';
import CMEditViewCopyLocale from '../CMEditViewCopyLocale';

import Bullet from './Bullet';
import { createLocalesOption } from './utils';

const CMEditViewLocalePicker = ({
  appLocales,
  createPermissions,
  currentEntityId,
  currentLocaleStatus,
  hasDraftAndPublishEnabled,
  isSingleType,
  localizations,
  query,
  readPermissions,
  setQuery,
  slug,
}) => {
  const { formatMessage } = useIntl();

  const currentLocale = get(query, 'plugins.i18n.locale', false);

  const { push } = useHistory();

  const handleChange = (value) => {
    if (value === currentLocale) {
      return;
    }

    const nextLocale = options.find((option) => {
      return option.value === value;
    });

    const { status, id } = nextLocale;

    let defaultParams = {
      plugins: {
        ...query.plugins,
        i18n: { ...query.plugins.i18n, locale: value },
      },
    };

    if (currentEntityId) {
      defaultParams.plugins.i18n.relatedEntityId = currentEntityId;
    }

    if (isSingleType) {
      setQuery(defaultParams);

      return;
    }

    if (status === 'did-not-create-locale') {
      push({
        pathname: `/content-manager/collectionType/${slug}/create`,
        search: stringify(defaultParams, { encode: false }),
      });

      return;
    }

    push({
      pathname: `/content-manager/collectionType/${slug}/${id}`,
      search: stringify(defaultParams, { encode: false }),
    });
  };

  const options = createLocalesOption(appLocales, localizations).filter(({ status, value }) => {
    if (status === 'did-not-create-locale') {
      return createPermissions.find(({ properties }) =>
        get(properties, 'locales', []).includes(value)
      );
    }

    return readPermissions.find(({ properties }) => get(properties, 'locales', []).includes(value));
  });

  const filteredOptions = options.filter(({ value }) => value !== currentLocale);
  const currentLocaleObject = appLocales.find(({ code }) => code === currentLocale);

  const value = options.find(({ value }) => {
    return value === currentLocale;
  }) || { value: currentLocaleObject.code, label: currentLocaleObject.name };

  if (!currentLocale) {
    return null;
  }

  return (
    <Box paddingTop={6}>
      <Typography variant="sigma" textColor="neutral600">
        {formatMessage({ id: getTrad('plugin.name'), defaultMessage: 'Internationalization' })}
      </Typography>
      <Divider unsetMargin={false} marginTop={2} marginBottom={6} />
      <Flex direction="column" alignItems="stretch" gap={2}>
        <Select
          label={formatMessage({
            id: getTrad('Settings.locales.modal.locales.label'),
          })}
          onChange={handleChange}
          value={value?.value}
        >
          <Option
            value={value?.value}
            disabled
            startIcon={hasDraftAndPublishEnabled ? <Bullet status={currentLocaleStatus} /> : null}
          >
            {value?.label}
          </Option>
          {filteredOptions.map((option) => {
            return (
              <Option
                key={option.value}
                value={option.value}
                startIcon={hasDraftAndPublishEnabled ? <Bullet status={option.status} /> : null}
              >
                {option.label}
              </Option>
            );
          })}
        </Select>
        <CMEditViewCopyLocale
          appLocales={appLocales}
          currentLocale={currentLocale}
          localizations={localizations}
          readPermissions={readPermissions}
        />
      </Flex>
    </Box>
  );
};

CMEditViewLocalePicker.defaultProps = {
  createPermissions: [],
  currentEntityId: null,
  currentLocaleStatus: 'did-not-create-locale',
  isSingleType: false,
  localizations: [],
  query: {},
  readPermissions: [],
};

CMEditViewLocalePicker.propTypes = {
  appLocales: PropTypes.array.isRequired,
  createPermissions: PropTypes.array,
  currentEntityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currentLocaleStatus: PropTypes.string,
  hasDraftAndPublishEnabled: PropTypes.bool.isRequired,
  isSingleType: PropTypes.bool,
  localizations: PropTypes.array,
  query: PropTypes.object,
  readPermissions: PropTypes.array,
  setQuery: PropTypes.func.isRequired,
  slug: PropTypes.string.isRequired,
};

export default CMEditViewLocalePicker;
