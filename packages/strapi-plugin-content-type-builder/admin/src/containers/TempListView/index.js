import React, { useEffect, useState } from 'react';
import { Prompt, useHistory, useLocation } from 'react-router-dom';
import { BackHeader } from 'strapi-helper-plugin';
import PropTypes from 'prop-types';
import { get, isEqual } from 'lodash';
import { Header } from '@buffetjs/custom';
import ListRow from '../../components/ListRow';
import List from '../../components/List';
import makeSearch from '../../utils/makeSearch';

import {
  ListWrapper,
  useGlobalContext,
  ViewContainer,
} from 'strapi-helper-plugin';

import useDataManager from '../../hooks/useDataManager';
import pluginId from '../../pluginId';
import ListHeader from '../../components/ListHeader';
import { ListButton } from '../../components/ListButton';
import getTrad from '../../utils/getTrad';
import LeftMenu from '../LeftMenu';

const ListPage = () => {
  /*
   *
   *   MOST OF THIS CODE NEEDS TO BE TRASHED!
   *   THE ONLY THING THAT NEEDS TO BE KEPT IS THE SEARCH GENERATED BY
   *    - handleClickEditField
   *    - handleClickAddAttributeMainData
   *    - handleClickAddAttributeNestedData
   *
   */
  const {
    initialData,
    modifiedData,
    isInContentTypeView,
    // removeAttribute,
    // removeComponentFromDynamicZone,
    submitData,
    toggleModalCancel,
  } = useDataManager();
  const { formatMessage } = useGlobalContext();
  const { push } = useHistory();
  const { search } = useLocation();
  const firstMainDataPath = isInContentTypeView ? 'contentType' : 'component';
  const mainDataTypeAttributesPath = [
    firstMainDataPath,
    'schema',
    'attributes',
  ];
  const [enablePrompt, togglePrompt] = useState(true);

  useEffect(() => {
    if (search === '') {
      togglePrompt(true);
    }
  }, [search]);

  // Disabling the prompt on the first render if one of the modal is open
  useEffect(() => {
    if (search !== '') {
      togglePrompt(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attributes = get(modifiedData, mainDataTypeAttributesPath, {});
  const attributesLength = Object.keys(attributes).length;

  const currentDataName = get(
    initialData,
    [firstMainDataPath, 'schema', 'name'],
    ''
  );
  const targetUid = get(modifiedData, [firstMainDataPath, 'uid']);

  const handleClickAddAttributeMainData = async () => {
    const forTarget = isInContentTypeView ? 'contentType' : 'component';
    const search = `modalType=chooseAttribute&forTarget=${forTarget}&targetUid=${targetUid}&headerDisplayName=${currentDataName}`;

    await wait();

    push({ search });
  };

  const handleClickEditField = async (
    forTarget,
    targetUid,
    attrName,
    type,
    headerDisplayName,
    headerDisplayCategory = null
    // TODO ADD LOGIC headerDisplaySubCategory when editing a field
    // It should be the same one as adding a field
  ) => {
    let attributeType;

    switch (type) {
      case 'integer':
      case 'biginteger':
      case 'decimal':
      case 'float':
        attributeType = 'number';
        break;
      case 'string':
      case 'text':
        attributeType = 'text';
        break;
      case '':
        attributeType = 'relation';
        break;
      default:
        attributeType = type;
    }

    const step = type === 'component' ? '&step=2' : '';
    const displayCategory = headerDisplayCategory
      ? `&headerDisplayCategory=${headerDisplayCategory}`
      : '';

    await wait();
    push({
      search: `modalType=attribute&actionType=edit&settingType=base&forTarget=${forTarget}&targetUid=${targetUid}&attributeName=${attrName}&attributeType=${attributeType}&headerDisplayName=${headerDisplayName}${step}${displayCategory}`,
    });
  };

  const getDescription = () => {
    const description = get(
      modifiedData,
      [firstMainDataPath, 'schema', 'description'],
      null
    );

    return description
      ? description
      : formatMessage({
          id: `${pluginId}.modelPage.contentHeader.emptyDescription.description`,
        });
  };

  const getActions = () => {
    return [
      {
        color: 'cancel',
        onClick: () => {
          console.log('cancel modifs');
          toggleModalCancel();
        },
        title: formatMessage({
          id: `${pluginId}.form.button.cancel`,
        }),
        type: 'button',
        disabled: isEqual(modifiedData, initialData) ? true : false,
      },
      {
        color: 'success',
        onClick: () => submitData(),
        title: formatMessage({
          id: `${pluginId}.form.button.save`,
        }),
        type: 'submit',
        disabled: isEqual(modifiedData, initialData) ? true : false,
      },
    ];
  };

  const label = get(modifiedData, [firstMainDataPath, 'schema', 'name'], '');

  const headerProps = {
    actions: getActions(),
    title: {
      label,
      cta: {
        icon: 'pencil-alt',
        onClick: async () => {
          await wait();

          push({
            search: makeSearch({
              modalType: firstMainDataPath,
              actionType: 'edit',
              settingType: 'base',
              forTarget: firstMainDataPath,
              targetUid,
              headerDisplayName: label,
            }),
          });
        },
      },
    },
    content: getDescription(),
  };

  const listTitle = [
    formatMessage(
      {
        id: `${pluginId}.table.attributes.title.${
          attributesLength > 1 ? 'plural' : 'singular'
        }`,
      },
      { number: attributesLength }
    ),
  ];

  const addButtonProps = {
    icon: true,
    color: 'primary',
    label: formatMessage({ id: `${pluginId}.button.attributes.add.another` }),
    onClick: () => handleClickAddAttributeMainData(),
  };

  const listActions = [{ ...addButtonProps }];

  const convertDataToArray = () => {
    return Object.keys(attributes).map((key, index) => {
      return { ...attributes[key], name: key, index };
    });
  };

  const handleClickOnTrashIcon = () => {};

  const CustomRow = ({ index, name, ...rest }) => {
    return (
      <ListRow
        {...rest}
        attributeId={index}
        name={name}
        onClick={handleClickEditField}
        onClickDelete={handleClickOnTrashIcon}
      />
    );
  };

  CustomRow.defaultProps = {
    index: 0,
    name: null,
  };

  CustomRow.propTypes = {
    index: PropTypes.number,
    name: PropTypes.string,
  };

  const hasModelBeenModified = !isEqual(modifiedData, initialData);

  const wait = async () => {
    // this.setState({ removePrompt: true });
    togglePrompt(false);
    return new Promise(resolve => setTimeout(resolve, 100));
  };

  return (
    <ViewContainer>
      <BackHeader />
      <Prompt
        message={formatMessage({ id: getTrad('prompt.unsaved') })}
        when={hasModelBeenModified && enablePrompt}
      />
      <div className="container-fluid">
        <div className="row">
          <LeftMenu wait={wait} togglePrompt={togglePrompt} />
          <div
            className="col-md-9 content"
            style={{ paddingLeft: 30, paddingRight: 30 }}
          >
            <Header {...headerProps} />

            <ListWrapper>
              <ListHeader actions={listActions} title={listTitle} />
              <List
                items={convertDataToArray()}
                customRowComponent={props => <CustomRow {...props} />}
              ></List>
              <ListButton {...addButtonProps}></ListButton>
            </ListWrapper>
          </div>
        </div>
      </div>
    </ViewContainer>
  );
};

export default ListPage;
