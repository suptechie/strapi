import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import BaselineAlignment from '../../../../components/BaselineAlignement';
import Button from '../../../../components/FullWidthButton';
import AuthLink from '../AuthLink';
import Input from '../Input';
import Logo from '../Logo';
import Section from '../Section';
import Box from '../Box';

const ForgotPassword = ({ formErrors, modifiedData, onChange, onSubmit }) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <Section textAlign="center">
        <Logo />
      </Section>
      <Section withBackground>
        <BaselineAlignment top size="25px">
          <Box>
            <form onSubmit={onSubmit}>
              <Input
                autoFocus
                error={formErrors.email}
                label="Auth.form.email.label"
                name="email"
                onChange={onChange}
                placeholder="Auth.form.email.placeholder"
                type="email"
                validations={{ required: true }}
                value={modifiedData.email}
              />
              <BaselineAlignment top size="13px">
                <Button type="submit" color="primary" textTransform="uppercase">
                  {formatMessage({ id: 'Auth.form.button.forgot-password' })}
                </Button>
              </BaselineAlignment>
            </form>
          </Box>
        </BaselineAlignment>
        <AuthLink label="Auth.link.ready" to="/auth/login" />
      </Section>
    </>
  );
};

ForgotPassword.defaultProps = {
  onSubmit: e => e.preventDefault(),
};

ForgotPassword.propTypes = {
  formErrors: PropTypes.object.isRequired,
  modifiedData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
};

export default ForgotPassword;
