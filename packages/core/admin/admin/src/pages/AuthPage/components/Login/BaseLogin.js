import React, { useState } from 'react';
import { Show, Hide } from '@strapi/icons';
import {
  Box,
  Stack,
  H1,
  Text,
  Subtitle,
  Checkbox,
  TextInput,
  Main,
  Row,
  Link,
  Button,
} from '@strapi/parts';
import { Form } from '@strapi/helper-plugin';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Formik } from 'formik';
import { Column, LayoutContent } from '../../../../layouts/UnauthenticatedLayout';
import Logo from '../Logo';
import FieldActionWrapper from '../FieldActionWrapper';

const Login = ({ onSubmit, schema, children }) => {
  const [passwordShown, setPasswordShown] = useState(false);
  const { formatMessage } = useIntl();

  return (
    <Main labelledBy="welcome">
      <LayoutContent>
        <Formik
          enableReinitialize
          initialValues={{
            email: '',
            password: '',
            rememberMe: false,
          }}
          onSubmit={onSubmit}
          validationSchema={schema}
          validateOnChange={false}
        >
          {({ values, errors, handleChange }) => (
            <Form noValidate>
              <Column>
                <Logo />
                <Box paddingTop="6" paddingBottom="1">
                  <H1 id="welcome">
                    {formatMessage({
                      id: 'Auth.form.welcome.title',
                      defaultMessage: 'Welcome back!',
                    })}
                  </H1>
                </Box>
                <Box paddingBottom="7">
                  <Subtitle textColor="neutral600">
                    {formatMessage({
                      id: 'Auth.form.welcome.subtitle',
                      defaultMessage: 'Log in to your Strapi account',
                    })}
                  </Subtitle>
                </Box>
                {errors.errorMessage && (
                  <Text id="global-form-error" role="alert" tabIndex={-1} textColor="danger600">
                    {errors.errorMessage}
                  </Text>
                )}
              </Column>

              <Stack size={6}>
                <TextInput
                  error={
                    errors.email
                      ? formatMessage({
                          id: errors.email,
                          defaultMessage: 'This value is required.',
                        })
                      : ''
                  }
                  value={values.email}
                  onChange={handleChange}
                  label={formatMessage({ id: 'Auth.form.email.label', defaultMessage: 'Email' })}
                  placeholder={formatMessage({
                    id: 'Auth.form.email.placeholder',
                    defaultMessage: 'kai@doe.com',
                  })}
                  name="email"
                  required
                />
                <TextInput
                  error={
                    errors.password
                      ? formatMessage({
                          id: errors.password,
                          defaultMessage: 'This value is required.',
                        })
                      : ''
                  }
                  onChange={handleChange}
                  value={values.password}
                  label={formatMessage({
                    id: 'Auth.form.password.label',
                    defaultMessage: 'Password',
                  })}
                  name="password"
                  type={passwordShown ? 'text' : 'password'}
                  endAction={
                    <FieldActionWrapper
                      onClick={e => {
                        e.stopPropagation();
                        setPasswordShown(prev => !prev);
                      }}
                      label={formatMessage(
                        passwordShown
                          ? {
                              id: 'Auth.form.password.show-password',
                              defaultMessage: 'Show password',
                            }
                          : {
                              id: 'Auth.form.password.hide-password',
                              defaultMessage: 'Hide password',
                            }
                      )}
                    >
                      {passwordShown ? <Show /> : <Hide />}
                    </FieldActionWrapper>
                  }
                  required
                />
                <Checkbox
                  onValueChange={checked => {
                    handleChange({ target: { value: checked, name: 'rememberMe' } });
                  }}
                  value={values.rememberMe}
                  aria-label="rememberMe"
                  name="rememberMe"
                >
                  {formatMessage({
                    id: 'Auth.form.rememberMe.label',
                    defaultMessage: 'Remember me',
                  })}
                </Checkbox>
                <Button fullWidth type="submit">
                  {formatMessage({ id: 'Auth.form.button.login', defaultMessage: 'Login' })}
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>
        {children}
      </LayoutContent>
      <Row justifyContent="center">
        <Box paddingTop={4}>
          <Link to="/auth/forgot-password">
            <Text small>
              {formatMessage({
                id: 'Auth.link.forgot-password',
                defaultMessage: 'Forgot your password?',
              })}
            </Text>
          </Link>
        </Box>
      </Row>
    </Main>
  );
};

Login.defaultProps = {
  children: null,
  onSubmit: () => {},
};

Login.propTypes = {
  children: PropTypes.node,
  onSubmit: PropTypes.func,
  schema: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }).isRequired,
};

export default Login;
