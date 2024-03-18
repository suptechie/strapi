import React, { useReducer } from 'react';

import { Page } from '@strapi/admin/strapi-admin';
import {
  Box,
  Button,
  ContentLayout,
  Flex,
  Grid,
  GridItem,
  HeaderLayout,
  Layout,
  Main,
  ToggleInput,
  Typography,
} from '@strapi/design-system';
import { useFetchClient, useFocusWhenNavigate, useNotification } from '@strapi/helper-plugin';
import { Check } from '@strapi/icons';
import isEqual from 'lodash/isEqual';
import { Helmet } from 'react-helmet';
import { useIntl } from 'react-intl';
import { useMutation, useQuery } from 'react-query';

import { PERMISSIONS } from '../../constants';
import { getTrad } from '../../utils';

import init from './init';
import reducer, { initialState } from './reducer';

export const SettingsPage = () => {
  const { formatMessage } = useIntl();
  const toggleNotification = useNotification();
  const { get, put } = useFetchClient();

  useFocusWhenNavigate();

  const [{ initialData, modifiedData }, dispatch] = useReducer(reducer, initialState, init);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['upload', 'settings'],
    async queryFn() {
      const {
        data: { data },
      } = await get('/upload/settings');

      return data;
    },
  });

  React.useEffect(() => {
    if (data) {
      dispatch({
        type: 'GET_DATA_SUCCEEDED',
        data,
      });
    }
  }, [data]);

  const isSaveButtonDisabled = isEqual(initialData, modifiedData);

  const { mutateAsync, isLoading: isSubmiting } = useMutation({
    async mutationFn(body) {
      return put('/upload/settings', body);
    },
    onSuccess() {
      refetch();

      toggleNotification({
        type: 'success',
        message: { id: 'notification.form.success.fields' },
      });
    },
    onError(err) {
      console.error(err);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSaveButtonDisabled) {
      return;
    }

    await mutateAsync(modifiedData);
  };

  const handleChange = ({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE',
      keys: name,
      value,
    });
  };

  if (isLoading) {
    return <Page.Loading />;
  }

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
            defaultMessage: 'Media Library',
          })}
          primaryAction={
            <Button
              disabled={isSaveButtonDisabled}
              loading={isSubmiting}
              type="submit"
              startIcon={<Check />}
              size="S"
            >
              {formatMessage({
                id: 'global.save',
                defaultMessage: 'Save',
              })}
            </Button>
          }
          subtitle={formatMessage({
            id: getTrad('settings.sub-header.label'),
            defaultMessage: 'Configure the settings for the Media Library',
          })}
        />
        <ContentLayout>
          <Layout>
            <Flex direction="column" alignItems="stretch" gap={12}>
              <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
                <Flex direction="column" alignItems="stretch" gap={4}>
                  <Flex>
                    <Typography variant="delta" as="h2">
                      {formatMessage({
                        id: getTrad('settings.blockTitle'),
                        defaultMessage: 'Asset management',
                      })}
                    </Typography>
                  </Flex>
                  <Grid gap={6}>
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        aria-label="responsiveDimensions"
                        checked={modifiedData.responsiveDimensions}
                        hint={formatMessage({
                          id: getTrad('settings.form.responsiveDimensions.description'),
                          defaultMessage:
                            'Enabling this option will generate multiple formats (small, medium and large) of the uploaded asset.',
                        })}
                        label={formatMessage({
                          id: getTrad('settings.form.responsiveDimensions.label'),
                          defaultMessage: 'Responsive friendly upload',
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
                        onChange={(e) => {
                          handleChange({
                            target: { name: 'responsiveDimensions', value: e.target.checked },
                          });
                        }}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        aria-label="sizeOptimization"
                        checked={modifiedData.sizeOptimization}
                        hint={formatMessage({
                          id: getTrad('settings.form.sizeOptimization.description'),
                          defaultMessage:
                            'Enabling this option will reduce the image size and slightly reduce its quality.',
                        })}
                        label={formatMessage({
                          id: getTrad('settings.form.sizeOptimization.label'),
                          defaultMessage: 'Size optimization',
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
                        onChange={(e) => {
                          handleChange({
                            target: { name: 'sizeOptimization', value: e.target.checked },
                          });
                        }}
                      />
                    </GridItem>
                    <GridItem col={6} s={12}>
                      <ToggleInput
                        aria-label="autoOrientation"
                        checked={modifiedData.autoOrientation}
                        hint={formatMessage({
                          id: getTrad('settings.form.autoOrientation.description'),
                          defaultMessage:
                            'Enabling this option will automatically rotate the image according to EXIF orientation tag.',
                        })}
                        label={formatMessage({
                          id: getTrad('settings.form.autoOrientation.label'),
                          defaultMessage: 'Auto orientation',
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
                        onChange={(e) => {
                          handleChange({
                            target: { name: 'autoOrientation', value: e.target.checked },
                          });
                        }}
                      />
                    </GridItem>
                  </Grid>
                </Flex>
              </Box>
            </Flex>
          </Layout>
        </ContentLayout>
      </form>
    </Main>
  );
};

const ProtectedSettingsPage = () => (
  <Page.Protect permissions={PERMISSIONS.settings}>
    <SettingsPage />
  </Page.Protect>
);

export default ProtectedSettingsPage;
