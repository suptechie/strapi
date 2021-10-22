import React, { useRef, useState } from 'react';
import moment from 'moment';
import {
  CheckPagePermissions,
  Form,
  LoadingIndicatorPage,
  SettingsPageTitle,
  request,
  useNotification,
  useOverlayBlocker,
  useTracking,
} from '@strapi/helper-plugin';
import { Box } from '@strapi/parts/Box';
import { Button } from '@strapi/parts/Button';
import { ContentLayout, HeaderLayout } from '@strapi/parts/Layout';
import { Grid, GridItem } from '@strapi/parts/Grid';
import { Main } from '@strapi/parts/Main';
import { Link } from '@strapi/parts/Link';
import { Flex } from '@strapi/parts/Flex';
import { Stack } from '@strapi/parts/Stack';
import { Text } from '@strapi/parts/Text';
import { TextInput } from '@strapi/parts/TextInput';
import { Textarea } from '@strapi/parts/Textarea';
import BackIcon from '@strapi/icons/BackIcon';
import { Formik } from 'formik';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { useIntl } from 'react-intl';
import { useHistory, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import Permissions from '../../../../../../../admin/src/pages/SettingsPage/pages/Roles/EditPage/components/Permissions';
import { useFetchPermissionsLayout, useFetchRole } from '../../../../../../../admin/src/hooks';
import adminPermissions from '../../../../../../../admin/src/permissions';
import schema from './utils/schema';

const UsersRoleNumber = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.primary200};
  background: ${({ theme }) => theme.colors.primary100};
  padding: ${({ theme }) => `${theme.spaces[2]} ${theme.spaces[4]}`};
  color: ${({ theme }) => theme.colors.primary600};
  border-radius: ${({ theme }) => theme.borderRadius};
  font-size: ${12 / 16}rem;
  font-width: bold;
`;

const CreatePage = () => {
  const toggleNotification = useNotification();
  const { lockApp, unlockApp } = useOverlayBlocker();
  const { formatMessage } = useIntl();
  const [isSubmitting, setIsSubmiting] = useState(false);
  const { replace } = useHistory();
  const permissionsRef = useRef();
  const { trackUsage } = useTracking();
  const params = useRouteMatch('/settings/roles/duplicate/:id');
  const id = get(params, 'params.id', null);
  const { isLoading: isLayoutLoading, data: permissionsLayout } = useFetchPermissionsLayout();
  const { permissions: rolePermissions, isLoading: isRoleLoading } = useFetchRole(id);

  const handleCreateRoleSubmit = data => {
    lockApp();
    setIsSubmiting(true);

    if (id) {
      trackUsage('willDuplicateRole');
    } else {
      trackUsage('willCreateNewRole');
    }

    Promise.resolve(
      request('/admin/roles', {
        method: 'POST',
        body: data,
      })
    )
      .then(async res => {
        const { permissionsToSend } = permissionsRef.current.getPermissions();

        if (id) {
          trackUsage('didDuplicateRole');
        } else {
          trackUsage('didCreateNewRole');
        }

        if (res.data.id && !isEmpty(permissionsToSend)) {
          await request(`/admin/roles/${res.data.id}/permissions`, {
            method: 'PUT',
            body: { permissions: permissionsToSend },
          });
        }

        return res;
      })
      .then(res => {
        setIsSubmiting(false);
        toggleNotification({
          type: 'success',
          message: { id: 'Settings.roles.created', defaultMessage: 'created' },
        });
        replace(`/settings/roles/${res.data.id}`);
      })
      .catch(err => {
        console.error(err);
        setIsSubmiting(false);
        toggleNotification({
          type: 'warning',
          message: { id: 'notification.error' },
        });
      })
      .finally(() => {
        unlockApp();
      });
  };

  const defaultDescription = `${formatMessage({
    id: 'Settings.roles.form.created',
    defaultMessage: 'Created',
  })} ${moment().format('LL')}`;

  return (
    <Main>
      <SettingsPageTitle name="Roles" />
      <Formik
        initialValues={{ name: '', description: defaultDescription }}
        onSubmit={handleCreateRoleSubmit}
        validationSchema={schema}
        validateOnChange={false}
      >
        {({ handleSubmit, values, errors, handleReset, handleChange }) => (
          <Form noValidate>
            <>
              <HeaderLayout
                primaryAction={
                  <Stack horizontal size={2}>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        handleReset();
                        permissionsRef.current.resetForm();
                      }}
                      size="L"
                    >
                      {formatMessage({
                        id: 'app.components.Button.reset',
                        defaultMessage: 'Reset',
                      })}
                    </Button>
                    <Button onClick={handleSubmit} loading={isSubmitting} size="L">
                      {formatMessage({
                        id: 'app.components.Button.save',
                        defaultMessage: 'Save',
                      })}
                    </Button>
                  </Stack>
                }
                title={formatMessage({
                  id: 'Settings.roles.create.title',
                  defaultMessage: 'Create a role',
                })}
                subtitle={formatMessage({
                  id: 'Settings.roles.create.description',
                  defaultMessage: 'Define the rights given to the role',
                })}
                navigationAction={
                  <Link startIcon={<BackIcon />} to="/settings/roles">
                    {formatMessage({
                      id: 'app.components.go-back',
                      defaultMessage: 'Go back',
                    })}
                  </Link>
                }
              />
              <ContentLayout>
                <Stack size={6}>
                  <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
                    <Stack size={4}>
                      <Flex justifyContent="space-between">
                        <Box>
                          <Box>
                            <Text bold>
                              {formatMessage({
                                id: 'Settings.roles.form.title',
                                defaultMessage: 'Details',
                              })}
                            </Text>
                          </Box>
                          <Box>
                            <Text textColor="neutral600" small>
                              {formatMessage({
                                id: 'Settings.roles.form.description',
                                defaultMessage: 'Name and description of the role',
                              })}
                            </Text>
                          </Box>
                        </Box>
                        <UsersRoleNumber>
                          {formatMessage(
                            {
                              id: 'Settings.roles.form.button.users-with-role',
                              defaultMessage:
                                '{number, plural, =0 {# users} one {# user} other {# users}} with this role',
                            },
                            { number: 0 }
                          )}
                        </UsersRoleNumber>
                      </Flex>
                      <Grid gap={4}>
                        <GridItem col={6}>
                          <TextInput
                            name="name"
                            error={errors.name && formatMessage({ id: errors.name })}
                            label={formatMessage({
                              id: 'Settings.roles.form.input.name',
                              defaultMessage: 'Name',
                            })}
                            onChange={handleChange}
                            value={values.name}
                          />
                        </GridItem>
                        <GridItem col={6}>
                          <Textarea
                            label={formatMessage({
                              id: 'Settings.roles.form.input.description',
                              defaultMessage: 'Description',
                            })}
                            name="description"
                            error={errors.description && formatMessage({ id: errors.description })}
                            onChange={handleChange}
                          >
                            {values.description}
                          </Textarea>
                        </GridItem>
                      </Grid>
                    </Stack>
                  </Box>
                  {!isLayoutLoading && !isRoleLoading ? (
                    <Box shadow="filterShadow" hasRadius>
                      <Permissions
                        isFormDisabled={false}
                        ref={permissionsRef}
                        permissions={rolePermissions}
                        layout={permissionsLayout}
                      />
                    </Box>
                  ) : (
                    <Box background="neutral0" padding={6} shadow="filterShadow" hasRadius>
                      <LoadingIndicatorPage />
                    </Box>
                  )}
                </Stack>
              </ContentLayout>
            </>
          </Form>
        )}
      </Formik>
    </Main>
  );
};

export default () => (
  <CheckPagePermissions permissions={adminPermissions.settings.roles.create}>
    <CreatePage />
  </CheckPagePermissions>
);

export { CreatePage };
