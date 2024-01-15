import * as React from 'react';

import {
  Box,
  Button,
  ContentLayout,
  Divider,
  Flex,
  Grid,
  GridItem,
  HeaderLayout,
  Main,
  Option,
  Select,
  Typography,
} from '@strapi/design-system';
import {
  CheckPagePermissions,
  ConfirmDialog,
  Link,
  LoadingIndicatorPage,
  useFetchClient,
  useNotification,
  useTracking,
} from '@strapi/helper-plugin';
import { ArrowLeft, Check } from '@strapi/icons';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import upperFirst from 'lodash/upperFirst';
import { useIntl } from 'react-intl';
import { useMutation } from 'react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { useTypedSelector } from '../../../core/store/hooks';
import { useContentTypeLayout } from '../../hooks/useLayouts';
import { type SettingsViewComponentLayout, formatLayoutForSettingsView } from '../../utils/layouts';
import { getTranslation } from '../../utils/translations';

import { DisplayedFields } from './components/DisplayedFields';
import { FormModal } from './components/FormModal';
import { LayoutDndProvider } from './components/LayoutDndProvider';
import { init } from './init';
import { reducer, initialState } from './reducer';
import { unformatLayout } from './utils/layout';

import type { Contracts } from '@strapi/plugin-content-manager/_internal/shared';
import type { AxiosError, AxiosResponse } from 'axios';

const EditSettingsView = () => {
  const { slug } = useParams();
  const { isLoading, layout, updateLayout } = useContentTypeLayout(slug);

  const { rawContentTypeLayout: mainLayout, rawComponentsLayouts: components } =
    React.useMemo(() => {
      let rawContentTypeLayout = null;
      let rawComponentsLayouts = null;

      if (layout?.contentType) {
        rawContentTypeLayout = formatLayoutForSettingsView(layout.contentType);
      }

      if (layout?.components) {
        rawComponentsLayouts = Object.keys(layout.components).reduce<
          Record<string, SettingsViewComponentLayout>
        >((acc, current) => {
          acc[current] = formatLayoutForSettingsView(layout.components[current]);

          return acc;
        }, {});
      }

      return { rawContentTypeLayout, rawComponentsLayouts };
    }, [layout]);

  const [reducerState, dispatch] = React.useReducer(reducer, initialState);

  React.useEffect(() => {
    if (mainLayout) {
      dispatch({
        type: 'SET_DATA',
        data: init(initialState, mainLayout, components ?? {}),
      });
    }
  }, [mainLayout, components]);

  const [isDraggingSibling, setIsDraggingSibling] = React.useState(false);
  const { trackUsage } = useTracking();
  const toggleNotification = useNotification();
  const navigate = useNavigate();
  const [isModalFormOpen, setIsModalFormOpen] = React.useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = React.useState(false);
  const { componentLayouts, initialData, modifiedData, metaToEdit, metaForm } = reducerState;
  const { formatMessage } = useIntl();
  const modelName = mainLayout?.info?.displayName;
  const attributes = modifiedData?.attributes ?? {};
  const fieldSizes = useTypedSelector((state) => state['content-manager_app'].fieldSizes);
  const { put } = useFetchClient();

  const entryTitleOptions = Object.keys(attributes).filter((attr) => {
    const type = attributes?.[attr]?.type ?? '';

    return (
      ![
        'dynamiczone',
        'json',
        'text',
        'relation',
        'component',
        'boolean',
        'media',
        'password',
        'richtext',
        'timestamp',
        'blocks',
      ].includes(type) && !!type
    );
  });
  const editLayout = modifiedData?.layouts?.edit ?? [];
  const displayedFields = editLayout.flatMap((layout) => layout.rowContent);
  const editLayoutFields = Object.keys(modifiedData?.attributes ?? {})
    .filter((attr) => (modifiedData?.metadatas?.[attr]?.edit?.visible ?? false) === true)
    .filter((attr) => displayedFields.findIndex((el) => el.name === attr) === -1)
    .sort();

  const handleChange = ({
    target: { name, value },
  }: {
    target: { name: string; value: string | boolean | null | number };
  }) => {
    dispatch({
      type: 'ON_CHANGE',
      keys: name.split('.'),
      value,
    });
  };

  const handleToggleModal = () => {
    setIsModalFormOpen((prev) => !prev);
  };

  const toggleConfirmDialog = () => {
    setIsConfirmDialogOpen((prev) => !prev);
  };

  const handleMetaChange = ({
    target: { name, value },
  }: {
    target: { name: string; value: string | boolean | number };
  }) => {
    dispatch({
      type: 'ON_CHANGE_META',
      keys: name.split('.'),
      value,
    });
  };

  const handleSizeChange = ({ value }: { value: number }) => {
    dispatch({
      type: 'ON_CHANGE_SIZE',
      value,
    });
  };

  const handleMetaSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    dispatch({
      type: 'SUBMIT_META_FORM',
    });
    handleToggleModal();
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    toggleConfirmDialog();
  };

  const submitMutation = useMutation<
    AxiosResponse<Contracts.ContentTypes.UpdateContentTypeConfiguration.Response>,
    AxiosError<Required<Pick<Contracts.CollectionTypes.BulkPublish.Response, 'error'>>>,
    Contracts.ContentTypes.UpdateContentTypeConfiguration.Request['body']
  >(
    (body) => {
      return put(`/content-manager/content-types/${slug}/configuration`, body);
    },
    {
      onSuccess() {
        if (updateLayout) {
          updateLayout();
        }
        dispatch({
          type: 'SUBMIT_SUCCEEDED',
        });
        toggleConfirmDialog();
        trackUsage('didEditEditSettings');
      },
      onError() {
        toggleNotification({ type: 'warning', message: { id: 'notification.error' } });
      },
    }
  );
  const { isLoading: isSubmittingForm } = submitMutation;

  const handleConfirm = () => {
    if (!modifiedData) {
      return;
    }

    const { layouts, metadatas, settings } = cloneDeep(modifiedData);

    submitMutation.mutate({
      layouts: {
        ...layouts,
        edit: unformatLayout(layouts.edit),
      },
      metadatas,
      settings,
    });
  };

  const moveItem = (
    dragIndex: number,
    hoverIndex: number,
    dragRowIndex: number,
    hoverRowIndex: number
  ) => {
    // Same row = just reorder
    if (dragRowIndex === hoverRowIndex) {
      dispatch({
        type: 'REORDER_ROW',
        dragRowIndex,
        dragIndex,
        hoverIndex,
      });
    } else {
      dispatch({
        type: 'REORDER_DIFF_ROW',
        dragIndex,
        hoverIndex,
        dragRowIndex,
        hoverRowIndex,
      });
    }
  };

  const moveRow = (fromIndex: number, toIndex: number) => {
    dispatch({
      type: 'MOVE_ROW',
      fromIndex,
      toIndex,
    });
  };

  if (isLoading) {
    return <LoadingIndicatorPage />;
  }

  return (
    <LayoutDndProvider
      isContentTypeView
      attributes={attributes}
      modifiedData={modifiedData}
      slug={slug ?? ''}
      componentLayouts={componentLayouts}
      selectedField={metaToEdit}
      fieldForm={metaForm}
      moveRow={moveRow}
      moveItem={moveItem}
      setEditFieldToSelect={(name: string) => {
        dispatch({
          type: 'SET_FIELD_TO_EDIT',
          name,
        });
        handleToggleModal();
      }}
      isDraggingSibling={isDraggingSibling}
      setIsDraggingSibling={setIsDraggingSibling}
    >
      <Main>
        <form onSubmit={handleSubmit}>
          <HeaderLayout
            title={formatMessage(
              {
                id: getTranslation('components.SettingsViewWrapper.pluginHeader.title'),
                defaultMessage: `Configure the view - ${upperFirst(modelName)}`,
              },
              { name: upperFirst(modelName) }
            )}
            subtitle={formatMessage({
              id: getTranslation(
                'components.SettingsViewWrapper.pluginHeader.description.edit-settings'
              ),
              defaultMessage: 'Customize how the edit view will look like.',
            })}
            navigationAction={
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <Link
                startIcon={<ArrowLeft />}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(-1);
                }}
                to=""
              >
                {formatMessage({
                  id: 'global.back',
                  defaultMessage: 'Back',
                })}
              </Link>
            }
            primaryAction={
              <Button
                disabled={isEqual(initialData, modifiedData)}
                startIcon={<Check />}
                type="submit"
              >
                {formatMessage({ id: 'global.save', defaultMessage: 'Save' })}
              </Button>
            }
          />
          <ContentLayout>
            <Box
              background="neutral0"
              hasRadius
              shadow="filterShadow"
              paddingTop={6}
              paddingBottom={6}
              paddingLeft={7}
              paddingRight={7}
            >
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Typography variant="delta" as="h2">
                  {formatMessage({
                    id: getTranslation('containers.SettingPage.settings'),
                    defaultMessage: 'Settings',
                  })}
                </Typography>
                <Grid>
                  <GridItem col={6} s={12}>
                    <Select
                      label={formatMessage({
                        id: getTranslation('containers.SettingPage.editSettings.entry.title'),
                        defaultMessage: 'Entry title',
                      })}
                      hint={formatMessage({
                        id: getTranslation(
                          'containers.SettingPage.editSettings.entry.title.description'
                        ),
                        defaultMessage: 'Set the display field of your entry',
                      })}
                      onChange={(value) => {
                        handleChange({
                          target: {
                            name: 'settings.mainField',
                            value: value === '' ? null : value,
                          },
                        });
                      }}
                      value={modifiedData?.settings?.mainField}
                    >
                      {entryTitleOptions.map((attribute) => (
                        <Option key={attribute} value={attribute}>
                          {attribute}
                        </Option>
                      ))}
                    </Select>
                  </GridItem>
                </Grid>
                <Box paddingTop={2} paddingBottom={2}>
                  <Divider />
                </Box>
                <Typography variant="delta" as="h3">
                  {formatMessage({
                    id: getTranslation('containers.SettingPage.view'),
                    defaultMessage: 'View',
                  })}
                </Typography>

                <DisplayedFields
                  editLayout={editLayout}
                  fields={editLayoutFields}
                  onAddField={(field) => {
                    dispatch({
                      type: 'ON_ADD_FIELD',
                      name: field,
                      fieldSizes,
                    });
                  }}
                  onRemoveField={(rowId, index) => {
                    dispatch({
                      type: 'REMOVE_FIELD',
                      rowIndex: rowId,
                      fieldIndex: index,
                    });
                  }}
                />
              </Flex>
            </Box>
          </ContentLayout>
          <ConfirmDialog
            bodyText={{
              id: getTranslation('popUpWarning.warning.updateAllSettings'),
              defaultMessage: 'This will modify all your settings',
            }}
            iconRightButton={<Check />}
            isConfirmButtonLoading={isSubmittingForm}
            isOpen={isConfirmDialogOpen}
            onToggleDialog={toggleConfirmDialog}
            onConfirm={handleConfirm}
            variantRightButton="success-light"
          />
        </form>
        {isModalFormOpen && (
          <FormModal
            onSubmit={handleMetaSubmit}
            onToggle={handleToggleModal}
            onMetaChange={handleMetaChange}
            onSizeChange={handleSizeChange}
            type={attributes?.[metaToEdit]?.type ?? ''}
            // @ts-expect-error - customField is not in the type
            customFieldUid={attributes?.[metaToEdit].customField ?? ''}
          />
        )}
      </Main>
    </LayoutDndProvider>
  );
};

const ProtectedEditSettingsView = () => {
  const permissions = useTypedSelector(
    (state) => state.admin_app.permissions.contentManager?.collectionTypesConfigurations
  );

  return (
    <CheckPagePermissions permissions={permissions}>
      <EditSettingsView />
    </CheckPagePermissions>
  );
};

export { ProtectedEditSettingsView, EditSettingsView };
