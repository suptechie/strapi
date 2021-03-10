import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Picker, Padded, Text, Flex } from '@buffetjs/core';
import { Carret, useQueryParams } from 'strapi-helper-plugin';
import styled from 'styled-components';
import get from 'lodash/get';

const List = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const ListItem = styled.li`
  margin-top: 0;
  margin-bottom: 0;
  margin-left: -10px;
  margin-right: -10px;
  padding-left: 10px;
  padding-right: 10px;
  height: 36px;
  line-height: 36px;

  &:hover {
    background: ${props => props.theme.main.colors.lightGrey};
  }
`;

const EllipsisParagraph = styled(Text)`
  width: ${props => props.width};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  text-align: left;
`;

const getInitialLocale = (query, locales = []) => {
  const localeFromQuery = get(query, 'query.pluginOptions.locale', undefined);

  if (localeFromQuery) {
    return locales.find(locale => locale.code === localeFromQuery);
  }

  return locales[0];
};

const selectContentManagerListViewPluginOptions = state =>
  state.get('content-manager_listView').contentType.pluginOptions;

const selectI18NLocales = state => state.get('i18n_locales').locales;

const LocalePicker = () => {
  console.log('lol');
  const dispatch = useDispatch();
  const pluginOptions = useSelector(selectContentManagerListViewPluginOptions);
  const locales = useSelector(selectI18NLocales);
  const [query, setQuery] = useQueryParams();

  const initialLocale = getInitialLocale(query, locales);
  const [selected, setSelected] = useState(initialLocale);

  const isFieldLocalized = get(pluginOptions, 'i18n.localized', false);

  if (!isFieldLocalized) {
    return null;
  }

  if (!locales || locales.length === 0) {
    return null;
  }

  return (
    <Picker
      position="right"
      renderButtonContent={isOpen => (
        <Flex>
          <EllipsisParagraph width="20ch">{selected.name}</EllipsisParagraph>

          <Padded left size="sm">
            <Carret fill={isOpen ? '#007eff' : '#292b2c'} isUp={isOpen} />
          </Padded>
        </Flex>
      )}
      renderSectionContent={onToggle => {
        const handleClick = locale => {
          dispatch({ type: 'ContentManager/RBACManager/RESET_PERMISSIONS' });
          setSelected(locale);
          setQuery({ pluginOptions: { ...query.pluginOptions, locale: locale.code } });
          onToggle();
        };

        return (
          <Padded top left right bottom>
            <List>
              {locales.map(locale => (
                <ListItem key={locale.id}>
                  <button onClick={() => handleClick(locale)} type="button">
                    <EllipsisParagraph width="200px">{locale.name}</EllipsisParagraph>
                  </button>
                </ListItem>
              ))}
            </List>
          </Padded>
        );
      }}
    />
  );
};

export default LocalePicker;
