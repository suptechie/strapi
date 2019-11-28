import React from 'react';
import { useHistory } from 'react-router-dom';
import { get, has, isEqual } from 'lodash';
import { Header } from '@buffetjs/custom';
import {
  List,
  ListWrapper,
  ViewContainer,
  useGlobalContext,
} from 'strapi-helper-plugin';

import ListHeader from '../../components/ListHeader';
import { ListButton } from '../../components/ListButton';
import useDataManager from '../../hooks/useDataManager';
import pluginId from '../../pluginId';

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
    removeAttribute,
  } = useDataManager();
  const { formatMessage } = useGlobalContext();
  const { push } = useHistory();
  const firstMainDataPath = isInContentTypeView ? 'contentType' : 'component';
  const mainDataTypeAttributesPath = [
    firstMainDataPath,
    'schema',
    'attributes',
  ];

  const attributes = get(modifiedData, mainDataTypeAttributesPath, {});
  const attributesLength = Object.keys(attributes).length;

  const currentDataName = get(
    initialData,
    [firstMainDataPath, 'schema', 'name'],
    ''
  );
  const targetUid = get(modifiedData, [firstMainDataPath, 'uid']);

  const handleClickAddAttributeMainData = () => {
    const forTarget = isInContentTypeView ? 'contentType' : 'component';
    const search = `modalType=chooseAttribute&forTarget=${forTarget}&targetUid=${targetUid}&headerDisplayName=${currentDataName}`;
    push({ search });
  };
  const handleClickAddAttributeNestedData = (targetUid, headerDisplayName) => {
    const search = `modalType=chooseAttribute&forTarget=components&targetUid=${targetUid}&headerDisplayName=${headerDisplayName}`;
    push({ search });
  };
  // TODO just a util not sure it should be kept
  const getType = attrName => {
    const type = has(modifiedData, [
      ...mainDataTypeAttributesPath,
      attrName,
      'nature',
    ])
      ? 'relation'
      : get(
          modifiedData,
          [...mainDataTypeAttributesPath, attrName, 'type'],
          ''
        );

    return type;
  };
  const getComponentSchema = componentName => {
    return get(modifiedData, ['components', componentName], {});
  };
  const getFirstLevelComponentName = compoName => {
    return get(
      modifiedData,
      [...mainDataTypeAttributesPath, compoName, 'component'],
      ''
    );
  };
  const getComponent = attrName => {
    const componentToGet = get(
      modifiedData,
      [...mainDataTypeAttributesPath, attrName, 'component'],
      ''
    );
    const componentSchema = getComponentSchema(componentToGet);

    return componentSchema;
  };
  const handleClickEditField = (
    forTarget,
    targetUid,
    attrName,
    type,
    headerDisplayName
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

    push({
      search: `modalType=attribute&actionType=edit&settingType=base&forTarget=${forTarget}&targetUid=${targetUid}&attributeName=${attrName}&attributeType=${attributeType}&headerDisplayName=${headerDisplayName}`,
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
    // const handleSubmit = () =>
    //   this.isUpdatingTempFeature()
    //     ? submitTempGroup(newGroup, this.context)
    //     : submitGroup(
    //         featureName,
    //         get(modifiedDataGroup, featureName),
    //         Object.assign(this.context, {
    //           history: this.props.history,
    //         }),
    //         this.getSource()
    //       );

    // const handleCancel = resetEditExistingGroup(this.getFeatureName());

    return [
      {
        color: 'cancel',
        onClick: () => {},
        title: formatMessage({
          id: `${pluginId}.form.button.cancel`,
        }),
        type: 'button',
        disabled: isEqual(modifiedData, initialData) ? true : false,
      },
      {
        color: 'success',
        onClick: () => {},
        title: formatMessage({
          id: `${pluginId}.form.button.save`,
        }),
        type: 'submit',
        disabled: isEqual(modifiedData, initialData) ? true : false,
      },
    ];
  };

  const headerProps = {
    actions: getActions(),
    title: {
      label: get(modifiedData, [firstMainDataPath, 'schema', 'name']),
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

  return (
    <ViewContainer>
      <div className="container-fluid">
        <div className="row">
          <LeftMenu />
          <div className="col-md-9 content">
            <Header {...headerProps} />

            <ListWrapper>
              <ListHeader actions={listActions} title={listTitle} />
              <List></List>
              <ListButton {...addButtonProps}></ListButton>
            </ListWrapper>

            {/* REALLY TEMPORARY SINCE IT DOESN T SUPPORT ANY NESTING COMPONENT*/}
            <ul>
              {Object.keys(attributes).map(attr => {
                const type = getType(attr);

                if (type === 'component') {
                  const compoData = getComponent(attr);
                  const componentSchema = get(
                    compoData,
                    ['schema', 'attributes'],
                    {}
                  );

                  return (
                    <li key={attr}>
                      <div>
                        <span>{attr}</span>
                        &nbsp;
                        <span>component</span>
                      </div>
                      <div
                        onClick={e => {
                          e.stopPropagation();
                          removeAttribute(
                            isInContentTypeView ? 'contentType' : 'component',
                            attr,
                            get(compoData, 'uid', '')
                          );
                        }}
                      >
                        REMOVE COMPO (fieldName: {attr}, compoName:{' '}
                        {get(compoData, 'uid')})
                      </div>
                      <hr />
                      <div> COMPONENT FIELDs:</div>
                      <ul>
                        {Object.keys(componentSchema).map(componentAttr => {
                          // Type of the component's attribute
                          const componentAttrType = get(
                            componentSchema,
                            [componentAttr, 'type'],
                            ''
                          );

                          if (componentAttrType === 'component') {
                            const nestedCompoNameUid = get(
                              componentSchema,
                              [componentAttr, 'component'],
                              'not found'
                            );
                            const nestedCompoData = getComponentSchema(
                              nestedCompoNameUid
                            );
                            const nestedCompoAttributes = get(
                              nestedCompoData,
                              ['schema', 'attributes'],
                              {}
                            );

                            return (
                              <li key={`${attr}.${componentAttr}`}>
                                <div>
                                  <span>{componentAttr}</span>
                                  &nbsp;
                                  <span>{componentAttrType}</span>
                                </div>
                                <div
                                  onClick={e => {
                                    e.stopPropagation();
                                    removeAttribute(
                                      'components',
                                      componentAttr,
                                      get(compoData, 'uid', '')
                                    );
                                  }}
                                >
                                  REMOVE NESTED COMPO FROM COMPONENT (fieldName:{' '}
                                  {componentAttr}, compoName:{' '}
                                  {get(compoData, 'uid')})
                                </div>
                                <hr />
                                <ul>
                                  {Object.keys(nestedCompoAttributes).map(
                                    nestedCompoAttribute => {
                                      const nestedComponentAttrType = get(
                                        nestedCompoAttributes,
                                        [nestedCompoAttribute, 'type'],
                                        ''
                                      );
                                      return (
                                        <li
                                          key={`${attr}.${componentAttr}.${nestedCompoAttribute}`}
                                          onClick={() =>
                                            handleClickEditField(
                                              'components',
                                              nestedCompoNameUid,
                                              nestedCompoAttribute,
                                              nestedComponentAttrType,
                                              nestedCompoNameUid
                                            )
                                          }
                                        >
                                          <div>
                                            <span>{nestedCompoAttribute}</span>
                                            &nbsp;
                                            <span>
                                              {nestedComponentAttrType}
                                            </span>
                                          </div>
                                          <div>
                                            <div
                                              onClick={e => {
                                                e.stopPropagation();
                                                removeAttribute(
                                                  'components',
                                                  nestedCompoAttribute,
                                                  nestedCompoNameUid
                                                );
                                              }}
                                            >
                                              REMOVE NESTED COMPONENT FIELD
                                              (fieldName: {nestedCompoAttribute}
                                              , compoName: {nestedCompoNameUid})
                                            </div>
                                          </div>
                                        </li>
                                      );
                                    }
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleClickAddAttributeNestedData(
                                        nestedCompoNameUid,
                                        componentAttr
                                      );
                                    }}
                                  >
                                    Add field to nested compo
                                  </button>
                                </ul>
                                <hr />
                              </li>
                            );
                          }

                          return (
                            <li
                              key={`${attr}.${componentAttr}`}
                              onClick={() =>
                                handleClickEditField(
                                  'components',
                                  getFirstLevelComponentName(attr),
                                  componentAttr,
                                  componentAttrType,
                                  attr
                                )
                              }
                            >
                              <div>
                                <span>{componentAttr}</span>
                                &nbsp;
                                <span>{componentAttrType}</span>
                              </div>
                              <div
                                onClick={e => {
                                  e.stopPropagation();
                                  removeAttribute(
                                    'components',
                                    componentAttr,
                                    getFirstLevelComponentName(attr)
                                  );
                                }}
                              >
                                REMOVE FIELD
                              </div>
                            </li>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() =>
                            handleClickAddAttributeNestedData(
                              get(compoData, 'uid', ''),
                              get(compoData, 'schema.name', 'ERROR')
                            )
                          }
                        >
                          Add field to compo
                        </button>
                      </ul>
                      <hr />
                    </li>
                  );
                }

                return (
                  <li
                    key={attr}
                    onClick={() =>
                      handleClickEditField(
                        isInContentTypeView ? 'contentType' : 'component',
                        targetUid,
                        attr,
                        type,
                        currentDataName
                      )
                    }
                  >
                    <div>
                      <span>{attr}</span>
                      &nbsp;
                      <span>{type}</span>
                    </div>
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        removeAttribute(
                          isInContentTypeView ? 'contentType' : 'component',
                          attr
                        );
                      }}
                    >
                      REMOVE FIELD
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </ViewContainer>
  );
};

export default ListPage;
