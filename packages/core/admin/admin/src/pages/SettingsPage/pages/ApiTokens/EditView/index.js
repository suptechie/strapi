import React, { useEffect, useState, useRef, useReducer } from 'react';
import { useIntl } from 'react-intl';
import {
  SettingsPageTitle,
  useFocusWhenNavigate,
  Form,
  useOverlayBlocker,
  useNotification,
  useTracking,
  useGuidedTour,
  Link,
  useRBAC,
} from '@strapi/helper-plugin';
import { HeaderLayout, ContentLayout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { Button } from '@strapi/design-system/Button';
import Check from '@strapi/icons/Check';
import ArrowLeft from '@strapi/icons/ArrowLeft';
import { Formik } from 'formik';
import { Stack } from '@strapi/design-system/Stack';
import { get } from 'lodash';
import { useRouteMatch, useHistory } from 'react-router-dom';
import { useQuery } from 'react-query';
import { formatAPIErrors } from '../../../../../utils';
import { axiosInstance } from '../../../../../core/utils';
import { schema } from './utils';
import LoadingView from './components/LoadingView';
import HeaderContentBox from './components/ContentBox';
import Permissions from './components/Permissions';
import Regenerate from './components/Regenerate';
import FormApiToken from './components/FormApiToken';
import adminPermissions from '../../../../../permissions';
import { ApiTokenPermissionsContextProvider } from '../../../../../contexts/ApiTokenPermissions';
import init from './init';
import reducer, { initialState } from './reducer';

const MSG_ERROR_NAME_TAKEN = 'Name already taken';

const ApiTokenCreateView = () => {
  useFocusWhenNavigate();
  const { formatMessage } = useIntl();
  const { lockApp, unlockApp } = useOverlayBlocker();
  const toggleNotification = useNotification();
  const history = useHistory();
  const [apiToken, setApiToken] = useState(
    history.location.state?.apiToken.accessKey
      ? {
          ...history.location.state.apiToken,
        }
      : null
  );
  const { trackUsage } = useTracking();
  const trackUsageRef = useRef(trackUsage);
  const { setCurrentStep } = useGuidedTour();
  const {
    allowedActions: { canCreate, canUpdate, canRegenerate },
  } = useRBAC(adminPermissions.settings['api-tokens']);
  const [state, dispatch] = useReducer(reducer, initialState, (state) => init(state, {}));
  const {
    params: { id },
  } = useRouteMatch('/settings/api-tokens/:id');

  const isCreating = id === 'create';

  useQuery(
    'content-api-permissions',
    async () => {
      const [permissions, routes] = await Promise.all(
        ['/admin/content-api/permissions', '/admin/content-api/routes'].map(async (url) => {
          const { data } = await axiosInstance.get(url);

          return data.data;
        })
      );

      dispatch({
        type: 'UPDATE_PERMISSIONS_LAYOUT',
        value: permissions,
      });

      dispatch({
        type: 'UPDATE_ROUTES',
        value: routes,
      });

      if (apiToken) {
        if (apiToken?.type === 'read-only') {
          dispatch({
            type: 'ON_CHANGE_READ_ONLY',
          });
        }
        if (apiToken?.type === 'full-access') {
          dispatch({
            type: 'SELECT_ALL_ACTIONS',
          });
        }
        if (apiToken?.type === 'custom') {
          dispatch({
            type: 'UPDATE_PERMISSIONS',
            value: apiToken?.permissions,
          });
        }
      }
    },
    {
      onError() {
        toggleNotification({
          type: 'warning',
          message: { id: 'notification.error', defaultMessage: 'An error occured' },
        });
      },
    }
  );

  useEffect(() => {
    trackUsageRef.current(isCreating ? 'didAddTokenFromList' : 'didEditTokenFromList');
  }, [isCreating]);

  const { status } = useQuery(
    ['api-token', id],
    async () => {
      const {
        data: { data },
      } = await axiosInstance.get(`/admin/api-tokens/${id}`);

      setApiToken({
        ...data,
      });

      if (data?.type === 'read-only') {
        dispatch({
          type: 'ON_CHANGE_READ_ONLY',
        });
      }
      if (data?.type === 'full-access') {
        dispatch({
          type: 'SELECT_ALL_ACTIONS',
        });
      }
      if (data?.type === 'custom') {
        dispatch({
          type: 'UPDATE_PERMISSIONS',
          value: data?.permissions,
        });
      }

      return data;
    },
    {
      enabled: !isCreating && !apiToken,
      onError() {
        toggleNotification({
          type: 'warning',
          message: { id: 'notification.error', defaultMessage: 'An error occured' },
        });
      },
    }
  );

  const handleSubmit = async (body, actions) => {
    trackUsageRef.current(isCreating ? 'willCreateToken' : 'willEditToken');
    lockApp();

    try {
      const {
        data: { data: response },
      } = isCreating
        ? await axiosInstance.post(`/admin/api-tokens`, {
            ...body,
            lifespan:
              body.lifespan && parseInt(body.lifespan, 10)
                ? parseInt(body.lifespan, 10)
                : body.lifespan,
            permissions: body.type === 'custom' ? state.selectedActions : null,
          })
        : await axiosInstance.put(`/admin/api-tokens/${id}`, {
            name: body.name,
            description: body.description,
            type: body.type,
            permissions: body.type === 'custom' ? state.selectedActions : null,
          });

      if (isCreating) {
        history.replace(`/settings/api-tokens/${response.id}`, { apiToken: response });
        setCurrentStep('apiTokens.success');
      }
      unlockApp();
      setApiToken({
        ...response,
      });

      toggleNotification({
        type: 'success',
        message: isCreating
          ? formatMessage({
              id: 'notification.success.tokencreated',
              defaultMessage: 'API Token successfully created',
            })
          : formatMessage({
              id: 'notification.success.tokenedited',
              defaultMessage: 'API Token successfully edited',
            }),
      });

      trackUsageRef.current(isCreating ? 'didCreateToken' : 'didEditToken', {
        type: apiToken.type,
      });
    } catch (err) {
      const errors = formatAPIErrors(err.response.data);
      actions.setErrors(errors);

      if (err?.response?.data?.error?.message === MSG_ERROR_NAME_TAKEN) {
        toggleNotification({
          type: 'warning',
          message: get(err, 'response.data.message', 'notification.error.tokennamenotunique'),
        });
      } else {
        toggleNotification({
          type: 'warning',
          message: get(err, 'response.data.message', 'notification.error'),
        });
      }
      unlockApp();
    }
  };

  const [hasChangedPermissions, setHasChangedPermissions] = useState(false);

  const handleChangeCheckbox = ({ target: { value } }) => {
    setHasChangedPermissions(true);
    dispatch({
      type: 'ON_CHANGE',
      value,
    });
  };

  const handleChangeSelectAllCheckbox = ({ target: { value } }) => {
    setHasChangedPermissions(true);
    dispatch({
      type: 'SELECT_ALL_IN_PERMISSION',
      value,
    });
  };

  const handleChangeSelectApiTokenType = ({ target: { value } }) => {
    setHasChangedPermissions(false);

    if (value === 'full-access') {
      dispatch({
        type: 'SELECT_ALL_ACTIONS',
      });
    }
    if (value === 'read-only') {
      dispatch({
        type: 'ON_CHANGE_READ_ONLY',
      });
    }
  };

  const setSelectedAction = ({ target: { value } }) => {
    dispatch({
      type: 'SET_SELECTED_ACTION',
      value,
    });
  };

  const handleRegenerate = (newKey) => {
    setApiToken({
      ...apiToken,
      accessKey: newKey,
    });
  };

  const providerValue = {
    ...state,
    onChange: handleChangeCheckbox,
    onChangeSelectAll: handleChangeSelectAllCheckbox,
    setSelectedAction,
  };

  const canEditInputs = (canUpdate && !isCreating) || (canCreate && isCreating);
  const isLoading = !isCreating && !apiToken && status !== 'success';

  if (isLoading) {
    return <LoadingView apiTokenName={apiToken?.name} />;
  }

  return (
    <ApiTokenPermissionsContextProvider value={providerValue}>
      <Main>
        <SettingsPageTitle name="API Tokens" />
        <Formik
          validationSchema={schema}
          validateOnChange={false}
          initialValues={{
            name: apiToken?.name || '',
            description: apiToken?.description || '',
            type: apiToken?.type,
            lifespan: apiToken?.lifespan ? apiToken.lifespan.toString() : apiToken?.lifespan,
          }}
          enableReinitialize
          onSubmit={(body, actions) => handleSubmit(body, actions)}
        >
          {({ errors, handleChange, isSubmitting, values, setFieldValue }) => {
            if (hasChangedPermissions && values?.type !== 'custom') {
              setFieldValue('type', 'custom');
            }

            return (
              <Form>
                <HeaderLayout
                  title={
                    apiToken?.name ||
                    formatMessage({
                      id: 'Settings.apiTokens.createPage.title',
                      defaultMessage: 'Create API Token',
                    })
                  }
                  primaryAction={
                    canEditInputs ? (
                      <Stack horizontal spacing={2}>
                        {canRegenerate && apiToken?.id && (
                          <Regenerate
                            onRegenerate={handleRegenerate}
                            idToRegenerate={apiToken?.id}
                          />
                        )}
                        <Button
                          disabled={isSubmitting}
                          loading={isSubmitting}
                          startIcon={<Check />}
                          type="submit"
                          size="S"
                        >
                          {formatMessage({
                            id: 'global.save',
                            defaultMessage: 'Save',
                          })}
                        </Button>
                      </Stack>
                    ) : (
                      canRegenerate &&
                      apiToken?.id && (
                        <Regenerate onRegenerate={handleRegenerate} idToRegenerate={apiToken?.id} />
                      )
                    )
                  }
                  navigationAction={
                    <Link startIcon={<ArrowLeft />} to="/settings/api-tokens">
                      {formatMessage({
                        id: 'global.back',
                        defaultMessage: 'Back',
                      })}
                    </Link>
                  }
                />
                <ContentLayout>
                  <Stack spacing={6}>
                    {Boolean(apiToken?.name) && <HeaderContentBox apiToken={apiToken.accessKey} />}
                    <FormApiToken
                      errors={errors}
                      onChange={handleChange}
                      canEditInputs={canEditInputs}
                      isCreating={isCreating}
                      values={values}
                      apiToken={apiToken}
                      onChangeSelectApiTokenType={(val) => handleChangeSelectApiTokenType(val)}
                    />
                    <Permissions
                      disabled={
                        !canEditInputs ||
                        values?.type === 'read-only' ||
                        values?.type === 'full-access'
                      }
                    />
                  </Stack>
                </ContentLayout>
              </Form>
            );
          }}
        </Formik>
      </Main>
    </ApiTokenPermissionsContextProvider>
  );
};

export default ApiTokenCreateView;
