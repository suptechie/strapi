import React from 'react';
import { useRouteMatch, useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import pick from 'lodash/pick';
import get from 'lodash/get';
import {
  CustomContentLayout,
  Form,
  GenericInput,
  SettingsPageTitle,
  auth,
  useAppInfos,
  useFocusWhenNavigate,
  useNotification,
  useOverlayBlocker,
} from '@strapi/helper-plugin';
import { useQuery } from 'react-query';
import { Formik } from 'formik';
import { Box } from '@strapi/parts/Box';
import { Button } from '@strapi/parts/Button';
import { Grid, GridItem } from '@strapi/parts/Grid';
import { HeaderLayout } from '@strapi/parts/Layout';
import { H3 } from '@strapi/parts/Text';
import { Main } from '@strapi/parts/Main';
import { Stack } from '@strapi/parts/Stack';
import { CheckIcon } from '@strapi/icons';
import MagicLink from 'ee_else_ce/pages/Users/components/MagicLink';
import { formatAPIErrors } from '../../../utils';
import { fetchUser, putUser } from './utils/api';
import layout from './utils/layout';
import { editValidation } from '../utils/validations/users';
import SelectRoles from '../components/SelectRoles';

const fieldsToPick = ['email', 'firstname', 'lastname', 'username', 'isActive', 'roles'];

const EditPage = ({ canUpdate }) => {
  const { formatMessage } = useIntl();
  const {
    params: { id },
  } = useRouteMatch('/settings/users/:id');
  const { push } = useHistory();
  const { setUserDisplayName } = useAppInfos();

  const toggleNotification = useNotification();
  const { lockApp, unlockApp } = useOverlayBlocker();
  useFocusWhenNavigate();

  const { status, data } = useQuery(['user', id], () => fetchUser(id), {
    retry: false,
    keepPreviousData: false,
    staleTime: 1000 * 20,
    onError: err => {
      const status = err.response.status;

      // Redirect the use to the homepage if is not allowed to read
      if (status === 403) {
        toggleNotification({
          type: 'info',
          message: {
            id: 'notification.permission.not-allowed-read',
            defaultMessage: 'You are not allowed to see this document',
          },
        });

        push('/');
      }
      console.log(err.response.status);
    },
  });

  const handleSubmit = async (body, actions) => {
    lockApp();

    try {
      const data = await putUser(id, body);

      const userInfos = auth.getUserInfo();

      // The user is updating himself
      if (id.toString() === userInfos.id.toString()) {
        auth.setUserInfo(data);

        const userDisplayName = get(body, 'username', `${body.firstname} ${body.lastname}`);

        setUserDisplayName(userDisplayName);
      }
    } catch (err) {
      // FIXME when API errors are ready
      const errors = formatAPIErrors(err.response.data);
      const fieldsErrors = Object.keys(errors).reduce((acc, current) => {
        acc[current] = errors[current].id;

        return acc;
      }, {});

      actions.setErrors(fieldsErrors);
      toggleNotification({
        type: 'warning',
        message: get(err, 'response.data.message', 'notification.error'),
      });
    }

    unlockApp();
  };

  const isLoading = status !== 'success';
  const headerLabel = isLoading
    ? { id: 'app.containers.Users.EditPage.header.label-loading', defaultMessage: 'Edit user' }
    : { id: 'app.containers.Users.EditPage.header.label', defaultMessage: 'Edit {name}' };

  const initialData = Object.keys(pick(data, fieldsToPick)).reduce((acc, current) => {
    if (current === 'roles') {
      acc[current] = (data?.roles || []).map(({ id }) => id);

      return acc;
    }

    acc[current] = data?.[current];

    return acc;
  }, {});

  const headerLabelName =
    initialData.username || `${initialData.firstname} ${initialData.lastname}`;

  const title = formatMessage(headerLabel, { name: headerLabelName });

  if (isLoading) {
    return (
      <Main labelledBy="title">
        <SettingsPageTitle name="Users" />
        <HeaderLayout
          id="title"
          primaryAction={
            <Button disabled startIcon={<CheckIcon />} type="button">
              {formatMessage({ id: 'form.button.save', defaultMessage: 'Save' })}
            </Button>
          }
          title={title}
        />
        <CustomContentLayout isLoading />
      </Main>
    );
  }

  return (
    <Main labelledBy="title">
      <SettingsPageTitle name="Users" />
      <Formik
        onSubmit={handleSubmit}
        initialValues={initialData}
        validateOnChange={false}
        validationSchema={editValidation}
      >
        {({ errors, values, handleChange, isSubmitting }) => {
          return (
            <Form>
              <HeaderLayout
                id="title"
                primaryAction={
                  <Button
                    disabled={isSubmitting || !canUpdate}
                    startIcon={<CheckIcon />}
                    loading={isSubmitting}
                    type="submit"
                  >
                    {formatMessage({ id: 'form.button.save', defaultMessage: 'Save' })}
                  </Button>
                }
                title={title}
              />
              <CustomContentLayout isLoading={isLoading}>
                {data?.registrationToken && (
                  <Box paddingBottom={6}>
                    <MagicLink registrationToken={data.registrationToken} />
                  </Box>
                )}
                <Stack size={7}>
                  <Box
                    background="neutral0"
                    hasRadius
                    shadow="filterShadow"
                    paddingTop={6}
                    paddingBottom={6}
                    paddingLeft={7}
                    paddingRight={7}
                  >
                    <Stack size={4}>
                      <H3 as="h2">
                        {formatMessage({
                          id: 'app.components.Users.ModalCreateBody.block-title.details',
                          defaultMessage: 'Details',
                        })}
                      </H3>
                      <Grid gap={5}>
                        {layout.map(row => {
                          return row.map(input => {
                            return (
                              <GridItem key={input.name} {...input.size}>
                                <GenericInput
                                  {...input}
                                  disabled={!canUpdate}
                                  error={errors[input.name]}
                                  onChange={handleChange}
                                  value={values[input.name] || ''}
                                />
                              </GridItem>
                            );
                          });
                        })}
                      </Grid>
                    </Stack>
                  </Box>
                  <Box
                    background="neutral0"
                    hasRadius
                    shadow="filterShadow"
                    paddingTop={6}
                    paddingBottom={6}
                    paddingLeft={7}
                    paddingRight={7}
                  >
                    <Stack size={4}>
                      <H3 as="h2">
                        {formatMessage({
                          id: 'app.components.Users.ModalCreateBody.block-title.login',
                          defaultMessage: 'Login settings',
                        })}
                      </H3>
                      <Grid gap={5}>
                        <GridItem col={6} xs={12}>
                          <SelectRoles
                            disabled={!canUpdate}
                            error={errors.roles}
                            onChange={handleChange}
                            value={values.roles}
                          />
                        </GridItem>
                      </Grid>
                    </Stack>
                  </Box>
                </Stack>
              </CustomContentLayout>
            </Form>
          );
        }}
      </Formik>
    </Main>
  );
};

EditPage.propTypes = {
  canUpdate: PropTypes.bool.isRequired,
};

export default EditPage;
