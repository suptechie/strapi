/**
 *
 * ModelPage
 *
 */

import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { bindActionCreators, compose } from 'redux';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';
import { get, isEqual, pickBy } from 'lodash';
import { Prompt } from 'react-router';

import Button from 'components/Button';
import EmptyAttributesBlock from 'components/EmptyAttributesBlock';
import PluginHeader from 'components/PluginHeader';
import PopUpWarning from 'components/PopUpWarning';
import { routerPropTypes } from 'commonPropTypes';

import getQueryParameters from 'utils/getQueryParameters';

import pluginId from '../../pluginId';

import AttributeLi from '../../components/AttributeLi';
import Block from '../../components/Block';
import Flex from '../../components/Flex';
import LeftMenu from '../../components/LeftMenu';
import LeftMenuSection from '../../components/LeftMenuSection';
import LeftMenuSectionTitle from '../../components/LeftMenuSectionTitle';
import LeftMenuLink from '../../components/LeftMenuLink';
import ListTitle from '../../components/ListTitle';
import Ul from '../../components/Ul';

import AttributeForm from '../AttributeForm';
import AttributesModalPicker from '../AttributesPickerModal';
import ModelForm from '../ModelForm';

import {
  addAttributeToExistingContentType,
  addAttributeToTempContentType,
  clearTemporaryAttribute,
  deleteModelAttribute,
  onCreateAttribute,
  resetEditExistingContentType,
  resetEditTempContentType,
  submitTempContentType,
} from '../App/actions';

import CustomLink from './CustomLink';

import makeSelectModelPage from './selectors';
import reducer from './reducer';
import saga from './saga';
import styles from './styles.scss';
import DocumentationSection from './DocumentationSection';

/* eslint-disable react/sort-comp */
export class ModelPage extends React.Component {
  // eslint-disable-line react/prefer-stateless-function
  state = { attrToDelete: null, removePrompt: false, showWarning: false };

  componentDidUpdate(prevProps) {
    const {
      location: { search },
      match: {
        params: { modelName },
      },
      resetEditExistingContentType,
    } = prevProps;

    if (!this.isUpdatingTemporaryContentType(modelName) && modelName !== this.props.match.params.modelName) {
      resetEditExistingContentType(modelName);
    }

    if (search !== this.props.location.search) {
      this.setPrompt();
    }
  }

  getFormData = () => {
    const {
      location: { search },
      modifiedData,
      newContentType,
    } = this.props;

    if (getQueryParameters(search, 'actionType') === 'create' || this.isUpdatingTemporaryContentType()) {
      return newContentType;
    }

    return get(modifiedData, this.getModelName());
  };

  getModel = () => {
    const { modifiedData, newContentType } = this.props;

    if (this.isUpdatingTemporaryContentType()) {
      return newContentType;
    }

    return get(modifiedData, this.getModelName(), {});
  };

  getModelAttributes = () => get(this.getModel(), 'attributes', {});

  getModelAttributesLength = () => Object.keys(this.getModelAttributes()).length;

  getModelDescription = () => {
    const { initialData } = this.props;

    const description = get(initialData, [this.getModelName(), 'description'], null);

    // eslint-disable-next-line no-extra-boolean-cast
    return !!description
      ? description
      : { id: `${pluginId}.modelPage.contentHeader.emptyDescription.description` };
  };

  getModelName = () => {
    const {
      match: {
        params: { modelName },
      },
    } = this.props;

    return modelName.split('&')[0];
  };

  getModelsNumber = () => {
    const { models } = this.props;

    return models.length;
  };

  getModelRelationShips = () => {
    const attributes = this.getModelAttributes();
    const relations = pickBy(attributes, attribute => {
      return !!get(attribute, 'target', null);
    });

    return relations;
  };

  getModelRelationShipsLength = () => Object.keys(this.getModelRelationShips()).length;

  getPluginHeaderActions = () => {
    const {
      initialData,
      modifiedData,
      resetEditExistingContentType,
      resetEditTempContentType,
      submitTempContentType,
    } = this.props;
    const shouldShowActions = this.isUpdatingTemporaryContentType()
      ? this.getModelAttributesLength() > 0
      : !isEqual(modifiedData[this.getModelName()], initialData[this.getModelName()]);
    const handleSubmit = this.isUpdatingTemporaryContentType() ? submitTempContentType : () => {};
    const handleCancel = this.isUpdatingTemporaryContentType()
      ? resetEditTempContentType
      : () => resetEditExistingContentType(this.getModelName());

    if (shouldShowActions) {
      return [
        {
          label: `${pluginId}.form.button.cancel`,
          onClick: handleCancel,
          kind: 'secondary',
          type: 'button',
        },
        {
          label: `${pluginId}.form.button.save`,
          onClick: handleSubmit,
          kind: 'primary',
          type: 'submit',
          id: 'saveData',
        },
      ];
    }

    return [];
  };

  getPluginHeaderTitle = () => {
    const { modifiedData, newContentType } = this.props;
    const name = this.getModelName();

    const title = this.isUpdatingTemporaryContentType()
      ? get(newContentType, 'name', null)
      : get(modifiedData, [name, 'name'], null);

    return title;
  };

  getSectionTitle = () => {
    const base = `${pluginId}.menu.section.contentTypeBuilder.name.`;

    return this.getModelsNumber() > 1 ? `${base}plural` : `${base}singular`;
  };

  handleClickEditModelMainInfos = async () => {
    const { canOpenModal } = this.props;
    await this.wait();

    if (canOpenModal || this.isUpdatingTemporaryContentType()) {
      this.props.history.push({
        search: `modalType=model&settingType=base&actionType=edit&modelName=${this.getModelName()}`,
      });
    } else {
      this.displayNotificationCTNotSaved();
    }
  };

  handleClickOpenModalChooseAttributes = async () => {
    const {
      canOpenModal,
      history: { push },
    } = this.props;
    await this.wait();

    if (canOpenModal || this.isUpdatingTemporaryContentType()) {
      push({ search: 'modalType=chooseAttributes' });
    } else {
      this.displayNotificationCTNotSaved();
    }
  };

  handleClickOpenModalCreateCT = () => {
    const {
      canOpenModal,
      history: { push },
    } = this.props;

    if (canOpenModal) {
      push({
        search: 'modalType=model&settingType=base&actionType=create',
      });
    } else {
      this.displayNotificationCTNotSaved();
    }
  };

  handleClickOnTrashIcon = attrToDelete => {
    const { canOpenModal } = this.props;

    if (canOpenModal || this.isUpdatingTemporaryContentType()) {
      this.setState({ showWarning: true, attrToDelete });
    } else {
      this.displayNotificationCTNotSaved();
    }
  };

  handleDeleteAttribute = () => {
    const { deleteModelAttribute } = this.props;
    const { attrToDelete } = this.state;

    const keys = this.isUpdatingTemporaryContentType()
      ? ['newContentType', 'attributes', attrToDelete]
      : ['modifiedData', this.getModelName(), 'attributes', attrToDelete];

    deleteModelAttribute(keys);
    this.setState({ attrToDelete: null, showWarning: false });
  };

  handleSubmit = (shouldContinue = false) => {
    const {
      addAttributeToExistingContentType,
      addAttributeToTempContentType,
      history: { push },
      location: { search },
    } = this.props;
    const attributeType = getQueryParameters(search, 'attributeType');

    if (this.isUpdatingTemporaryContentType()) {
      addAttributeToTempContentType(attributeType);
    } else {
      addAttributeToExistingContentType(this.getModelName(), attributeType);
    }

    const nextSearch = shouldContinue ? 'modalType=chooseAttributes' : '';

    push({ search: nextSearch });
  };

  hasModelBeenModified = () => {
    const {
      initialData,
      location: { search },
      modifiedData,
    } = this.props;
    const currentModel = this.getModelName();

    return !isEqual(initialData[currentModel], modifiedData[currentModel]) && search === '';
  };

  isUpdatingTemporaryContentType = (modelName = this.getModelName()) => {
    const { models } = this.props;
    /* istanbul ignore next */
    const currentModel = models.find(model => model.name === modelName) || { isTemporary: true };

    const { isTemporary } = currentModel;

    return isTemporary;
  };

  setPrompt = () => this.setState({ removePrompt: false });

  shouldRedirect = () => {
    const { models } = this.props;

    return models.findIndex(model => model.name === this.getModelName()) === -1;
  };

  toggleModalWarning = () => this.setState(prevState => ({ showWarning: !prevState.showWarning }));

  wait = async () => {
    this.setState({ removePrompt: true });
    return new Promise(resolve => setTimeout(resolve, 100));
  };

  displayNotificationCTNotSaved = () =>
    strapi.notification.info(`${pluginId}.notification.info.contentType.creating.notSaved`);

  renderLinks = () => {
    const { models } = this.props;
    const links = models.map(model => {
      const { isTemporary, name, source } = model;
      const base = `/plugins/${pluginId}/models/${name}`;
      const to = source ? `${base}&source=${source}` : base;

      return (
        <LeftMenuLink
          key={name}
          icon="fa fa-caret-square-o-right"
          isTemporary={isTemporary}
          name={name}
          source={source}
          to={to}
        />
      );
    });

    return links;
  };

  renderLi = attribute => {
    const attributeInfos = get(this.getModelAttributes(), attribute, {});

    return (
      <AttributeLi
        key={attribute}
        name={attribute}
        attributeInfos={attributeInfos}
        onClickOnTrashIcon={this.handleClickOnTrashIcon}
      />
    );
  };

  render() {
    const listTitleMessageIdBasePrefix = `${pluginId}.modelPage.contentType.list.title`;
    const {
      cancelNewContentType,
      clearTemporaryAttribute,
      createTempContentType,
      history: { push },
      location: { pathname, search },
      models,
      modifiedData,
      onChangeExistingContentTypeMainInfos,
      onChangeNewContentTypeMainInfos,
      onCreateAttribute,
      resetExistingContentTypeMainInfos,
      resetNewContentTypeMainInfos,
      temporaryAttribute,
      updateTempContentType,
    } = this.props;
    const { showWarning, removePrompt } = this.state;

    if (this.shouldRedirect()) {
      const { name, source } = models[0];
      const to = source ? `${name}&source=${source}` : name;

      return <Redirect to={to} />;
    }

    const modalType = getQueryParameters(search, 'modalType');
    const settingType = getQueryParameters(search, 'settingType');
    const attributeType = getQueryParameters(search, 'attributeType');
    const actionType = getQueryParameters(search, 'actionType');

    return (
      <div className={styles.modelpage}>
        <FormattedMessage id={`${pluginId}.prompt.content.unsaved`}>
          {msg => <Prompt when={this.hasModelBeenModified() && !removePrompt} message={msg} />}
        </FormattedMessage>
        <div className="container-fluid">
          <div className="row">
            <LeftMenu>
              <LeftMenuSection>
                <LeftMenuSectionTitle id={this.getSectionTitle()} />
                <ul>
                  {this.renderLinks()}
                  <CustomLink onClick={this.handleClickOpenModalCreateCT} />
                </ul>
              </LeftMenuSection>
              <LeftMenuSection>
                <LeftMenuSectionTitle id={`${pluginId}.menu.section.documentation.name`} />
                <DocumentationSection />
              </LeftMenuSection>
            </LeftMenu>

            <div className="col-md-9">
              <div className={styles.componentsContainer}>
                <PluginHeader
                  description={this.getModelDescription()}
                  icon="fa fa-pencil"
                  title={this.getPluginHeaderTitle()}
                  actions={this.getPluginHeaderActions()}
                  onClickIcon={this.handleClickEditModelMainInfos}
                />
                {this.getModelAttributesLength() === 0 ? (
                  <EmptyAttributesBlock
                    description="content-type-builder.home.emptyAttributes.description"
                    id="openAddAttr"
                    label="content-type-builder.button.attributes.add"
                    onClick={this.handleClickOpenModalChooseAttributes}
                    title="content-type-builder.home.emptyAttributes.title"
                  />
                ) : (
                  <Block>
                    <Flex>
                      <ListTitle>
                        {this.getModelAttributesLength()}
                        &nbsp;
                        <FormattedMessage
                          id={`${listTitleMessageIdBasePrefix}.${
                            this.getModelAttributesLength() > 1 ? 'plural' : 'singular'
                          }`}
                        />
                        {this.getModelRelationShipsLength() > 0 && (
                          <React.Fragment>
                            &nbsp;
                            <FormattedMessage id={`${listTitleMessageIdBasePrefix}.including`} />
                            &nbsp;
                            {this.getModelRelationShipsLength()}
                            &nbsp;
                            <FormattedMessage
                              id={`${pluginId}.modelPage.contentType.list.relationShipTitle.${
                                this.getModelRelationShipsLength() > 1 ? 'plural' : 'singular'
                              }`}
                            />
                          </React.Fragment>
                        )}
                      </ListTitle>
                      <div>
                        <Button
                          label={`${pluginId}.button.attributes.add`}
                          onClick={this.handleClickOpenModalChooseAttributes}
                          secondaryHotlineAdd
                        />
                      </div>
                    </Flex>
                    <div>
                      <Ul id="attributesList">{Object.keys(this.getModelAttributes()).map(this.renderLi)}</Ul>
                    </div>
                  </Block>
                )}
              </div>
            </div>
          </div>
        </div>
        <AttributesModalPicker isOpen={modalType === 'chooseAttributes'} push={push} />
        <AttributeForm
          activeTab={settingType}
          alreadyTakenAttributes={Object.keys(this.getModelAttributes())}
          attributeType={attributeType}
          isContentTypeTemporary={this.isUpdatingTemporaryContentType()}
          isOpen={modalType === 'attributeForm' && attributeType !== 'relation'}
          modifiedData={temporaryAttribute}
          onCancel={clearTemporaryAttribute}
          onChange={onCreateAttribute}
          onSubmit={this.handleSubmit}
          push={push}
        />
        <ModelForm
          actionType={actionType}
          activeTab={settingType}
          cancelNewContentType={cancelNewContentType}
          createTempContentType={createTempContentType}
          currentData={modifiedData}
          modifiedData={this.getFormData()}
          modelToEditName={getQueryParameters(search, 'modelName')}
          onChangeExistingContentTypeMainInfos={onChangeExistingContentTypeMainInfos}
          onChangeNewContentTypeMainInfos={onChangeNewContentTypeMainInfos}
          isOpen={modalType === 'model'}
          isUpdatingTemporaryContentType={this.isUpdatingTemporaryContentType()}
          pathname={pathname}
          push={push}
          resetExistingContentTypeMainInfos={resetExistingContentTypeMainInfos}
          resetNewContentTypeMainInfos={resetNewContentTypeMainInfos}
          updateTempContentType={updateTempContentType}
        />
        <PopUpWarning
          isOpen={showWarning}
          toggleModal={this.toggleModalWarning}
          content={{ message: `${pluginId}.popUpWarning.bodyMessage.attribute.delete` }}
          popUpWarningType="danger"
          onConfirm={this.handleDeleteAttribute}
        />
      </div>
    );
  }
}

ModelPage.defaultProps = {
  canOpenModal: true,
};

ModelPage.propTypes = {
  ...routerPropTypes({ params: PropTypes.string }).isRequired,
  addAttributeToExistingContentType: PropTypes.func.isRequired,
  addAttributeToTempContentType: PropTypes.func.isRequired,
  cancelNewContentType: PropTypes.func.isRequired,
  canOpenModal: PropTypes.bool,
  clearTemporaryAttribute: PropTypes.func.isRequired,
  createTempContentType: PropTypes.func.isRequired,
  deleteModelAttribute: PropTypes.func.isRequired,
  initialData: PropTypes.object.isRequired,
  models: PropTypes.array.isRequired,
  modifiedData: PropTypes.object.isRequired,
  newContentType: PropTypes.object.isRequired,
  onChangeExistingContentTypeMainInfos: PropTypes.func.isRequired,
  onChangeNewContentTypeMainInfos: PropTypes.func.isRequired,
  onCreateAttribute: PropTypes.func.isRequired,
  resetEditExistingContentType: PropTypes.func.isRequired,
  resetEditTempContentType: PropTypes.func.isRequired,
  resetExistingContentTypeMainInfos: PropTypes.func.isRequired,
  resetNewContentTypeMainInfos: PropTypes.func.isRequired,
  submitTempContentType: PropTypes.func.isRequired,
  temporaryAttribute: PropTypes.object.isRequired,
  updateTempContentType: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  modelpage: makeSelectModelPage(),
});

export function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      addAttributeToExistingContentType,
      addAttributeToTempContentType,
      clearTemporaryAttribute,
      deleteModelAttribute,
      onCreateAttribute,
      resetEditExistingContentType,
      resetEditTempContentType,
      submitTempContentType,
    },
    dispatch,
  );
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

/* Remove this line if the container doesn't have a route and
 *  check the documentation to see how to create the container's store
 */
const withReducer = strapi.injectReducer({ key: 'modelPage', reducer, pluginId });

/* Remove the line below the container doesn't have a route and
 *  check the documentation to see how to create the container's store
 */
const withSaga = strapi.injectSaga({ key: 'modelPage', saga, pluginId });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(ModelPage);
