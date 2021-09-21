import React, { useEffect, useReducer, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useIntl } from 'react-intl';
import {
  CheckPagePermissions,
  LoadingIndicatorPage,
  useFocusWhenNavigate,
  useNotification,
  useOverlayBlocker,
} from '@strapi/helper-plugin';
import { CheckIcon } from '@strapi/icons';
import {
  ContentLayout,
  Box,
  Button,
  Main,
  HeaderLayout,
  Stack,
  Grid,
  GridItem,
  Layout,
  Row,
  ToggleInput,
  H3,
} from '@strapi/parts';
import axios from 'axios';
import isEqual from 'lodash/isEqual';
import { axiosInstance, getRequestUrl, getTrad } from '../../utils';
import init from './init';
import reducer, { initialState } from './reducer';
import pluginPermissions from '../../permissions';

export const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const { lockApp, unlockApp } = useOverlayBlocker();
  const toggleNotification = useNotification();
  useFocusWhenNavigate();

  const [{ initialData, isLoading, isSubmiting, modifiedData }, dispatch] = useReducer(
    reducer,
    initialState,
    init
  );

  const isMounted = useRef(true);

  useEffect(() => {
    const CancelToken = axios.CancelToken;
    const source = CancelToken.source();

    const getData = async () => {
      try {
        const {
          data: { data },
        } = await axiosInstance.get(getRequestUrl('settings'), {
          cancelToken: source.token,
        });

        dispatch({
          type: 'GET_DATA_SUCCEEDED',
          data,
        });
      } catch (err) {
        console.error(err);
      }
    };

    if (isMounted.current) {
      getData();
    }

    return () => {
      source.cancel('Operation canceled by the user.');
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSaveButtonDisabled = isEqual(initialData, modifiedData);

  const handleSubmit = async e => {
    e.preventDefault();

    if (isSaveButtonDisabled) {
      return;
    }

    lockApp();

    dispatch({ type: 'ON_SUBMIT' });

    try {
      await axiosInstance.put(getRequestUrl('settings'), modifiedData);

      dispatch({
        type: 'SUBMIT_SUCCEEDED',
      });

      toggleNotification({
        type: 'success',
        message: { id: 'notification.form.success.fields' },
      });
    } catch (err) {
      console.error(err);

      dispatch({ type: 'ON_SUBMIT_ERROR' });
    }

    unlockApp();
  };

  const handleChange = ({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE',
      keys: name,
      value,
    });
  };

  return (
    <Main tabIndex={-1}>
      <Helmet
        title={formatMessage({
          id: getTrad('page.title'),
          defaultMessage: 'Settings - Media Libray',
        })}
      />
      <form onSubmit={handleSubmit}>
        <HeaderLayout
          title={formatMessage({
            id: getTrad('settings.header.label'),
            defaultMessage: 'Media Library - Settings',
          })}
          primaryAction={
            <Button
              disabled={isSaveButtonDisabled}
              data-testid="save-button"
              loading={isSubmiting}
              type="submit"
              startIcon={<CheckIcon />}
              size="L"
            >
              {formatMessage({
                id: 'app.components.Button.save',
                defaultMessage: 'Save',
              })}
            </Button>
          }
          subtitle={formatMessage({
            id: getTrad('settings.sub-header.label'),
            defaultMessage: 'Configure the settings for the media library',
          })}
        />
        <ContentLayout>
          {isLoading ? (
            <LoadingIndicatorPage />
          ) : (
            <Layout>
              <Stack size={12}>
                <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
                  <Stack size={4}>
                    <Row>
                      <H3 as="h2">
                        {formatMessage({
                          id: getTrad('settings.section.image.label'),
                          defaultMessage: 'Image',
                        })}
                      </H3>
                    </Row>
                    <Grid gap={6}>
                      <GridItem col={6} s={12}>
                        <ToggleInput
                          aria-label="responsiveDimensions"
                          data-testid="responsiveDimensions"
                          checked={modifiedData.responsiveDimensions}
                          hint={formatMessage({
                            id: getTrad('settings.form.responsiveDimensions.description'),
                            defaultMessage:
                              'It automatically generates multiple formats (large, medium, small) of the uploaded asset',
                          })}
                          label={formatMessage({
                            id: getTrad('settings.form.responsiveDimensions.label'),
                            defaultMessage: 'Enable responsive friendly upload',
                          })}
                          name="responsiveDimensions"
                          offLabel={formatMessage({
                            id: 'app.components.ToggleCheckbox.off-label',
                            defaultMessage: 'Off',
                          })}
                          onLabel={formatMessage({
                            id: 'app.components.ToggleCheckbox.on-label',
                            defaultMessage: 'On',
                          })}
                          onChange={e => {
                            handleChange({
                              target: { name: 'responsiveDimensions', value: e.target.checked },
                            });
                          }}
                        />
                      </GridItem>
                      <GridItem col={6} s={12}>
                        <ToggleInput
                          aria-label="sizeOptimization"
                          data-testid="sizeOptimization"
                          checked={modifiedData.sizeOptimization}
                          label={formatMessage({
                            id: getTrad('settings.form.sizeOptimization.label'),
                            defaultMessage: 'Enable size optimization (without quality loss)',
                          })}
                          name="sizeOptimization"
                          offLabel={formatMessage({
                            id: 'app.components.ToggleCheckbox.off-label',
                            defaultMessage: 'Off',
                          })}
                          onLabel={formatMessage({
                            id: 'app.components.ToggleCheckbox.on-label',
                            defaultMessage: 'On',
                          })}
                          onChange={e => {
                            handleChange({
                              target: { name: 'sizeOptimization', value: e.target.checked },
                            });
                          }}
                        />
                      </GridItem>
                      <GridItem col={6} s={12}>
                        <ToggleInput
                          aria-label="autoOrientation"
                          data-testid="autoOrientation"
                          checked={modifiedData.autoOrientation}
                          hint={formatMessage({
                            id: getTrad('settings.form.autoOrientation.description'),
                            defaultMessage:
                              'Automatically rotate image according to EXIF orientation tag',
                          })}
                          label={formatMessage({
                            id: getTrad('settings.form.autoOrientation.label'),
                            defaultMessage: 'Enable auto orientation',
                          })}
                          name="autoOrientation"
                          offLabel={formatMessage({
                            id: 'app.components.ToggleCheckbox.off-label',
                            defaultMessage: 'Off',
                          })}
                          onLabel={formatMessage({
                            id: 'app.components.ToggleCheckbox.on-label',
                            defaultMessage: 'On',
                          })}
                          onChange={e => {
                            handleChange({
                              target: { name: 'autoOrientation', value: e.target.checked },
                            });
                          }}
                        />
                      </GridItem>
                    </Grid>
                  </Stack>
                </Box>
              </Stack>
            </Layout>
          )}
        </ContentLayout>
      </form>
    </Main>
  );
};

const ProtectedSettingsPage = () => (
  <CheckPagePermissions permissions={pluginPermissions.settings}>
    <SettingsPage />
  </CheckPagePermissions>
);

export default ProtectedSettingsPage;
