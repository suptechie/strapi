import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { useHistory, useLocation } from 'react-router-dom';
import {
  BackHeader,
  LiLink,
  LoadingIndicatorPage,
  CheckPermissions,
  useUser,
  useUserPermissions,
} from 'strapi-helper-plugin';
import { Padded } from '@buffetjs/core';
import pluginPermissions from '../../permissions';
import Container from '../../components/Container';
import DynamicZone from '../../components/DynamicZone';
import FormWrapper from '../../components/FormWrapper';
import FieldComponent from '../../components/FieldComponent';
import Inputs from '../../components/Inputs';
import SelectWrapper from '../../components/SelectWrapper';
import { ContentTypeLayoutContext } from '../../contexts';
import { useFetchContentTypeLayout } from '../../hooks';
import { generatePermissionsObject, getInjectedComponents } from '../../utils';
import CollectionTypeWrapper from '../CollectionTypeWrapper';
import EditViewDataManagerProvider from '../EditViewDataManagerProvider';
import SingleTypeWrapper from '../SingleTypeWrapper';
import Header from './Header';
import { createAttributesLayout, getFieldsActionMatchingPermissions } from './utils';
import { LinkWrapper, SubWrapper } from './components';
import DeleteLink from './DeleteLink';
import InformationCard from './InformationCard';

/* eslint-disable  react/no-array-index-key */
const EditView = ({ currentEnvironment, isSingleType, plugins, slug }) => {
  // TODO
  const { isLoading, layout } = useFetchContentTypeLayout(slug);
  const { goBack } = useHistory();
  const { pathname, state } = useLocation();
  // Permissions
  const viewPermissions = useMemo(() => generatePermissionsObject(slug), [slug]);
  const { allowedActions, isLoading: isLoadingForPermissions } = useUserPermissions(
    viewPermissions
  );
  const userPermissions = useUser();

  // Here in case of a 403 response when fetching data we will either redirect to the previous page
  // Or to the homepage if there's no state in the history stack
  const from = get(state, 'from', '/');

  const {
    createActionAllowedFields,
    readActionAllowedFields,
    updateActionAllowedFields,
  } = useMemo(() => {
    return getFieldsActionMatchingPermissions(userPermissions, slug);
  }, [userPermissions, slug]);
  const configurationPermissions = useMemo(() => {
    return isSingleType
      ? pluginPermissions.singleTypesConfigurations
      : pluginPermissions.collectionTypesConfigurations;
  }, [isSingleType]);
  // TODO check why the routing needs to be different... (not prio)
  const configurationsURL = isSingleType
    ? `${pathname}/ctm-configurations/edit-settings/content-types`
    : 'ctm-configurations/edit-settings/content-types';

  const currentContentTypeLayoutData = useMemo(() => get(layout, ['contentType'], {}), [layout]);

  const DataManagementWrapper = useMemo(
    () => (isSingleType ? SingleTypeWrapper : CollectionTypeWrapper),
    [isSingleType]
  );

  // Check if a block is a dynamic zone
  const isDynamicZone = useCallback(block => {
    return block.every(subBlock => {
      return subBlock.every(obj => obj.fieldSchema.type === 'dynamiczone');
    });
  }, []);

  const formattedContentTypeLayout = useMemo(() => {
    if (!currentContentTypeLayoutData.layouts) {
      return [];
    }

    return createAttributesLayout(
      currentContentTypeLayoutData.layouts.edit,
      currentContentTypeLayoutData.schema.attributes
    );
  }, [currentContentTypeLayoutData]);

  if (isLoading) {
    return <LoadingIndicatorPage />;
  }

  if (isLoadingForPermissions) {
    return <LoadingIndicatorPage />;
  }

  // TODO: create a hook to handle/provide the permissions this should be done for the i18n feature
  // TODO: Remove layout provider!
  return (
    <ContentTypeLayoutContext.Provider value={layout}>
      <DataManagementWrapper allLayoutData={layout} from={from} slug={slug}>
        {({
          componentsDataStructure,
          contentTypeDataStructure,
          data,
          isCreatingEntry,
          isLoadingForData,
          onDelete,
          onDeleteSucceeded,
          onPost,
          onPublish,
          onPut,
          onUnpublish,
          status,
        }) => {
          return (
            <EditViewDataManagerProvider
              allowedActions={allowedActions}
              allLayoutData={layout}
              createActionAllowedFields={createActionAllowedFields}
              componentsDataStructure={componentsDataStructure}
              contentTypeDataStructure={contentTypeDataStructure}
              from={from}
              initialValues={data}
              isCreatingEntry={isCreatingEntry}
              isLoadingForData={isLoadingForData}
              isSingleType={isSingleType}
              onPost={onPost}
              onPublish={onPublish}
              onPut={onPut}
              onUnpublish={onUnpublish}
              readActionAllowedFields={readActionAllowedFields}
              // TODO check if needed
              redirectToPreviousPage={goBack}
              slug={slug}
              status={status}
              updateActionAllowedFields={updateActionAllowedFields}
            >
              <BackHeader onClick={goBack} />
              <Container className="container-fluid">
                <Header allowedActions={allowedActions} />
                <div className="row" style={{ paddingTop: 3 }}>
                  <div className="col-md-12 col-lg-9" style={{ marginBottom: 13 }}>
                    {formattedContentTypeLayout.map((block, blockIndex) => {
                      if (isDynamicZone(block)) {
                        const {
                          0: {
                            0: { name, fieldSchema, metadatas },
                          },
                        } = block;

                        return (
                          <DynamicZone
                            key={blockIndex}
                            name={name}
                            fieldSchema={fieldSchema}
                            metadatas={metadatas}
                          />
                        );
                      }

                      return (
                        <FormWrapper key={blockIndex}>
                          {block.map((fieldsBlock, fieldsBlockIndex) => {
                            return (
                              <div className="row" key={fieldsBlockIndex}>
                                {fieldsBlock.map(
                                  ({ name, size, fieldSchema, metadatas }, fieldIndex) => {
                                    const isComponent = fieldSchema.type === 'component';

                                    if (isComponent) {
                                      const {
                                        component,
                                        max,
                                        min,
                                        repeatable = false,
                                      } = fieldSchema;
                                      const componentUid = fieldSchema.component;

                                      return (
                                        <FieldComponent
                                          key={componentUid}
                                          componentUid={component}
                                          isRepeatable={repeatable}
                                          label={metadatas.label}
                                          max={max}
                                          min={min}
                                          name={name}
                                        />
                                      );
                                    }

                                    return (
                                      <div className={`col-${size}`} key={name}>
                                        <Inputs
                                          autoFocus={
                                            blockIndex === 0 &&
                                            fieldsBlockIndex === 0 &&
                                            fieldIndex === 0
                                          }
                                          fieldSchema={fieldSchema}
                                          keys={name}
                                          metadatas={metadatas}
                                        />
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            );
                          })}
                        </FormWrapper>
                      );
                    })}
                  </div>
                  <div className="col-md-12 col-lg-3">
                    <InformationCard />
                    <Padded size="smd" top />
                    {currentContentTypeLayoutData.layouts.editRelations.length > 0 && (
                      <SubWrapper style={{ padding: '0 20px 1px', marginBottom: '25px' }}>
                        <div style={{ paddingTop: '22px' }}>
                          {currentContentTypeLayoutData.layouts.editRelations.map(
                            ({ name, fieldSchema, metadatas, queryInfos }) => {
                              return (
                                <SelectWrapper
                                  {...fieldSchema}
                                  {...metadatas}
                                  queryInfos={queryInfos}
                                  key={name}
                                  name={name}
                                  relationsType={fieldSchema.relationType}
                                />
                              );
                            }
                          )}
                        </div>
                      </SubWrapper>
                    )}
                    <LinkWrapper>
                      <ul>
                        <CheckPermissions permissions={configurationPermissions}>
                          <LiLink
                            message={{
                              id: 'app.links.configure-view',
                            }}
                            icon="layout"
                            url={configurationsURL}
                            onClick={() => {
                              // emitEvent('willEditContentTypeLayoutFromEditView');
                            }}
                          />
                        </CheckPermissions>
                        {getInjectedComponents(
                          'editView',
                          'right.links',
                          plugins,
                          currentEnvironment,
                          slug
                        )}
                        {allowedActions.canDelete && (
                          <DeleteLink
                            isCreatingEntry={isCreatingEntry}
                            onDelete={onDelete}
                            onDeleteSucceeded={onDeleteSucceeded}
                          />
                        )}
                      </ul>
                    </LinkWrapper>
                  </div>
                </div>
              </Container>
            </EditViewDataManagerProvider>
          );
        }}
      </DataManagementWrapper>
    </ContentTypeLayoutContext.Provider>
  );
};

EditView.defaultProps = {
  currentEnvironment: 'production',
  plugins: {},
  isSingleType: false,
};

EditView.propTypes = {
  currentEnvironment: PropTypes.string,
  isSingleType: PropTypes.bool,
  plugins: PropTypes.object,
  slug: PropTypes.string.isRequired,
};

export { EditView };
export default memo(EditView);
