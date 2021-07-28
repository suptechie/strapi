import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Header, List } from '@buffetjs/custom';
import { Pencil } from '@buffetjs/icons';
import { get } from 'lodash';
import {
  SettingsPageTitle,
  SizedInput,
  useTracking,
  request,
  getYupInnerErrors,
  useNotification,
  useOverlayBlocker,
  CheckPagePermissions,
} from '@strapi/helper-plugin';
import { Row } from 'reactstrap';
import pluginPermissions from '../../permissions';
import { useForm } from '../../hooks';
import ListBaselineAlignment from '../../components/ListBaselineAlignment';
import ListRow from '../../components/ListRow';
import ModalForm from '../../components/ModalForm';
import { getRequestURL, getTrad } from '../../utils';
import forms from './utils/forms';
import schema from './utils/schema';

const Protected = () => (
  <CheckPagePermissions permissions={pluginPermissions.readEmailTemplates}>
    <EmailTemplatesPage />
  </CheckPagePermissions>
);

const EmailTemplatesPage = () => {
  const { formatMessage } = useIntl();
  const { trackUsage } = useTracking();
  const toggleNotification = useNotification();
  const { lockApp, unlockApp } = useOverlayBlocker();
  const trackUsageRef = useRef(trackUsage);
  const buttonSubmitRef = useRef(null);
  const pageTitle = formatMessage({ id: getTrad('HeaderNav.link.emailTemplates') });
  const updatePermissions = useMemo(() => {
    return { update: pluginPermissions.updateEmailTemplates };
  }, []);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState(null);

  const {
    allowedActions: { canUpdate },
    dispatchResetForm,
    dispatchSetFormErrors,
    dispatchSubmitSucceeded,
    formErrors,
    handleChange,
    isLoading,
    isLoadingForPermissions,
    modifiedData,
  } = useForm('email-templates', updatePermissions);

  const emailTemplates = useMemo(() => {
    return Object.keys(modifiedData).reduce((acc, current) => {
      const { display, icon } = modifiedData[current];

      acc.push({
        id: current,
        name: formatMessage({ id: getTrad(display) }),
        icon: ['fas', icon],
      });

      return acc;
    }, []);
  }, [modifiedData, formatMessage]);

  const listTitle = useMemo(() => {
    const count = emailTemplates.length;

    return formatMessage(
      {
        id: getTrad(`List.title.emailTemplates.${count > 1 ? 'plural' : 'singular'}`),
      },
      { number: count }
    );
  }, [emailTemplates.length, formatMessage]);

  const handleClosed = useCallback(() => {
    setTemplateToEdit(null);
    setShowForm(false);
    dispatchResetForm();
  }, [dispatchResetForm]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClickEdit = useCallback(
    template => {
      setTemplateToEdit(template);
      handleToggle();
    },
    [handleToggle]
  );

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault();

      let errors = {};

      try {
        setIsSubmiting(true);
        await schema.validate(modifiedData[templateToEdit.id], { abortEarly: false });

        lockApp();

        try {
          trackUsageRef.current('willEditEmailTemplates');

          await request(getRequestURL('email-templates'), {
            method: 'PUT',
            body: { 'email-templates': modifiedData },
          });

          trackUsageRef.current('didEditEmailTemplates');

          toggleNotification({
            type: 'success',
            message: { id: getTrad('notification.success.submit') },
          });

          dispatchSubmitSucceeded();

          handleToggle();
        } catch (err) {
          console.error(err);

          toggleNotification({
            type: 'warning',
            message: { id: 'notification.error' },
          });
        }
      } catch (err) {
        errors = getYupInnerErrors(err);
      } finally {
        setIsSubmiting(false);
        unlockApp();
      }

      dispatchSetFormErrors(errors);
    },
    [
      dispatchSetFormErrors,
      dispatchSubmitSucceeded,
      modifiedData,
      templateToEdit,
      handleToggle,
      toggleNotification,
      lockApp,
      unlockApp,
    ]
  );

  const handleClick = useCallback(() => {
    buttonSubmitRef.current.click();
  }, []);

  const handleOpened = useCallback(() => {
    setShowForm(true);
  }, []);

  return (
    <>
      <SettingsPageTitle name={pageTitle} />
      <div>
        <Header title={{ label: pageTitle }} isLoading={isLoadingForPermissions || isLoading} />
        <ListBaselineAlignment />
        <List
          title={listTitle}
          items={emailTemplates}
          isLoading={isLoadingForPermissions || isLoading}
          customRowComponent={template => (
            <ListRow
              {...template}
              onClick={() => {
                if (canUpdate) {
                  handleClickEdit(template);
                }
              }}
              links={[
                {
                  icon: canUpdate ? <Pencil fill="#0e1622" /> : null,
                  onClick: e => {
                    e.stopPropagation();
                    handleClickEdit(template);
                  },
                },
              ]}
            />
          )}
        />
      </div>
      <ModalForm
        isOpen={isOpen}
        onOpened={handleOpened}
        onToggle={handleToggle}
        onClosed={handleClosed}
        headerBreadcrumbs={[
          getTrad('PopUpForm.header.edit.email-templates'),
          get(templateToEdit, 'name', ''),
        ]}
        onClick={handleClick}
        onCancel={handleToggle}
        isLoading={isSubmiting}
      >
        {showForm && (
          <form onSubmit={handleSubmit}>
            <Row>
              {forms.map(input => {
                const id = get(templateToEdit, 'id');

                return (
                  <SizedInput
                    key={input.name}
                    {...input}
                    error={formErrors[input.name]}
                    name={`${id}.${input.name}`}
                    onChange={handleChange}
                    value={get(modifiedData, [id, ...input.name.split('.')], '')}
                  />
                );
              })}
            </Row>
            <button type="submit" style={{ display: 'none' }} ref={buttonSubmitRef}>
              hidden button to use the native form event
            </button>
          </form>
        )}
      </ModalForm>
    </>
  );
};

export default Protected;
