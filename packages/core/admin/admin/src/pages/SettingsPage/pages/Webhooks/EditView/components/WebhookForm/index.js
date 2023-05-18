import React, { useState } from 'react';
import PropTypes from 'prop-types';
import castArray from 'lodash/castArray';
import { Field, FormikProvider, useFormik } from 'formik';
import { useIntl } from 'react-intl';
import { Form, Link } from '@strapi/helper-plugin';
import { ArrowLeft, Check, Play as Publish } from '@strapi/icons';
import { Button, Flex, TextInput } from '@strapi/design-system';

import EventTable from 'ee_else_ce/pages/SettingsPage/pages/Webhooks/EditView/components/EventTable';
import schema from '../utils/schema';
import * as Layout from './Layout';
import HeadersInput from '../HeadersInput';
import TriggerContainer from '../TriggerContainer';

const WebhookForm = ({
  handleSubmit,
  triggerWebhook,
  isCreating,
  isTriggering,
  triggerResponse,
  data,
}) => {
  const { formatMessage } = useIntl();
  const [showTriggerResponse, setShowTriggerResponse] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: data?.name || '',
      url: data?.url || '',
      headers: castArray(data?.headers || []),
      events: data?.events || [],
    },
    onSubmit: handleSubmit,
    validationSchema: schema,
    validateOnChange: false,
    validateOnBlur: false,
  });

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        <Layout.Header
          primaryAction={
            <Flex gap={2}>
              <Button
                onClick={() => {
                  triggerWebhook();
                  setShowTriggerResponse(true);
                }}
                variant="tertiary"
                startIcon={<Publish />}
                disabled={isCreating || isTriggering}
                size="L"
              >
                {formatMessage({
                  id: 'Settings.webhooks.trigger',
                  defaultMessage: 'Trigger',
                })}
              </Button>
              <Button
                startIcon={<Check />}
                type="submit"
                size="L"
                disabled={!formik.dirty}
                loading={formik.isSubmitting}
              >
                {formatMessage({
                  id: 'global.save',
                  defaultMessage: 'Save',
                })}
              </Button>
            </Flex>
          }
          title={
            isCreating
              ? formatMessage({
                  id: 'Settings.webhooks.create',
                  defaultMessage: 'Create a webhook',
                })
              : data?.name
          }
          navigationAction={
            <Link startIcon={<ArrowLeft />} to="/settings/webhooks">
              {formatMessage({
                id: 'global.back',
                defaultMessage: 'Back',
              })}
            </Link>
          }
        />
        <Layout.Root
          triggerContainer={
            showTriggerResponse && (
              <div className="trigger-wrapper">
                <TriggerContainer
                  isPending={isTriggering}
                  response={triggerResponse}
                  onCancel={() => setShowTriggerResponse(false)}
                />
              </div>
            )
          }
        >
          <Layout.Fields
            name={
              <Field
                as={TextInput}
                name="name"
                error={formik.errors.name && formatMessage({ id: formik.errors.name })}
                label={formatMessage({
                  id: 'global.name',
                  defaultMessage: 'Name',
                })}
                required
              />
            }
            url={
              <Field
                as={TextInput}
                name="url"
                error={formik.errors.url && formatMessage({ id: formik.errors.url })}
                label={formatMessage({
                  id: 'Settings.roles.form.input.url',
                  defaultMessage: 'Url',
                })}
                required
              />
            }
          />
          <HeadersInput />
          <EventTable />
        </Layout.Root>
      </Form>
    </FormikProvider>
  );
};

WebhookForm.propTypes = {
  data: PropTypes.object,
  handleSubmit: PropTypes.func.isRequired,
  triggerWebhook: PropTypes.func.isRequired,
  isCreating: PropTypes.bool.isRequired,
  isTriggering: PropTypes.bool.isRequired,
  triggerResponse: PropTypes.object,
};

WebhookForm.defaultProps = {
  data: undefined,
  triggerResponse: undefined,
};

export default WebhookForm;
