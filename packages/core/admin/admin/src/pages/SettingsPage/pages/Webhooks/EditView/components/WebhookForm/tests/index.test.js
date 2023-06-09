import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { QueryClientProvider, QueryClient } from 'react-query';
import { lightTheme, ThemeProvider } from '@strapi/design-system';
import { NotificationsProvider } from '@strapi/helper-plugin';

import en from '../../../../../../../../translations/en.json';
import LanguageProvider from '../../../../../../../../components/LanguageProvider';
import WebhookForm from '../index';

jest.mock('../../../../../../../../hooks/useContentTypes');

const makeApp = (component) => {
  const queryClient = new QueryClient();
  const history = createMemoryHistory();
  const messages = { en };
  const localeNames = { en: 'English' };

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider messages={messages} localeNames={localeNames}>
        <ThemeProvider theme={lightTheme}>
          <Router history={history}>
            <NotificationsProvider toggleNotification={() => {}}>{component}</NotificationsProvider>
          </Router>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

describe('Create Webhook', () => {
  it('renders without crashing', () => {
    const triggerWebhook = jest.fn();
    triggerWebhook.cancel = jest.fn();

    const App = makeApp(
      <WebhookForm
        handleSubmit={jest.fn()}
        isCreating={false}
        isTriggering={false}
        isTriggerIdle={false}
        triggerWebhook={triggerWebhook}
        data={{
          name: '',
        }}
      />
    );

    render(App);
  });

  it('submit the form', async () => {
    const triggerWebhook = jest.fn();
    triggerWebhook.cancel = jest.fn();

    const handleSubmit = jest.fn();

    const App = makeApp(
      <WebhookForm
        handleSubmit={handleSubmit}
        isCreating={false}
        isTriggering={false}
        isTriggerIdle={false}
        triggerWebhook={triggerWebhook}
        data={{
          name: '',
        }}
      />
    );

    render(App);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'My webhook' } });
    fireEvent.change(screen.getByLabelText(/url/i), { target: { value: 'https://google.fr' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /entry.create/i }));

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit.mock.calls[0][0]).toEqual({
        name: 'My webhook',
        url: 'https://google.fr',
        events: ['entry.create'],
        headers: [{ key: '', value: '' }],
      });
    });
  });
});
