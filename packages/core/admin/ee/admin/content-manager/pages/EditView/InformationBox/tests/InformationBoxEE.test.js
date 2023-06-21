import React from 'react';

import { lightTheme, ThemeProvider } from '@strapi/design-system';
import { useCMEditViewDataManager } from '@strapi/helper-plugin';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { InformationBoxEE } from '../InformationBoxEE';

const STAGE_ATTRIBUTE_NAME = 'strapi_reviewWorkflows_stage';
const STAGE_FIXTURE = {
  id: 1,
  color: '#4945FF',
  name: 'Stage 1',
  worklow: 1,
};

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useCMEditViewDataManager: jest.fn(),
  useNotification: jest.fn(() => ({
    toggleNotification: jest.fn(),
  })),
}));

jest.mock(
  '../../../../../pages/SettingsPage/pages/ReviewWorkflows/hooks/useReviewWorkflows',
  () => ({
    useReviewWorkflows: jest.fn(() => ({
      isLoading: false,
      workflows: [
        {
          stages: [
            {
              id: 1,
              color: '#4945FF',
              name: 'Stage 1',
            },
            {
              id: 2,
              color: '#4945FF',
              name: 'Stage 2',
            },
          ],
        },
      ],
    })),
  })
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const ComponentFixture = (props) => <InformationBoxEE {...props} />;

const setup = (props) => ({
  ...render(<ComponentFixture {...props} />, {
    wrapper({ children }) {
      const store = createStore((state = {}) => state, {});

      return (
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <IntlProvider locale="en" defaultLocale="en">
              <ThemeProvider theme={lightTheme}>{children}</ThemeProvider>
            </IntlProvider>
          </QueryClientProvider>
        </Provider>
      );
    },
  }),
  user: userEvent.setup(),
});

describe('EE | Content Manager | EditView | InformationBox', () => {
  it('renders the title and body of the Information component', () => {
    useCMEditViewDataManager.mockReturnValue({
      initialData: {},
      isCreatingEntry: true,
      layout: { uid: 'api::articles:articles' },
    });

    const { getByText } = setup();

    expect(getByText('Information')).toBeInTheDocument();
    expect(getByText('Last update')).toBeInTheDocument();
  });

  it('renders no select input, if no workflow stage is assigned to the entity', () => {
    useCMEditViewDataManager.mockReturnValue({
      initialData: {},
      layout: { uid: 'api::articles:articles' },
    });

    const { queryByRole } = setup();

    expect(queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders an error, if no workflow stage is assigned to the entity', () => {
    useCMEditViewDataManager.mockReturnValue({
      initialData: {
        [STAGE_ATTRIBUTE_NAME]: null,
      },
      layout: { uid: 'api::articles:articles' },
    });

    const { getByText, queryByRole } = setup();

    expect(getByText(/select a stage/i)).toBeInTheDocument();
    expect(queryByRole('combobox')).toBeInTheDocument();
  });

  it('does not render the select input, if the entity is created', () => {
    useCMEditViewDataManager.mockReturnValue({
      initialData: {
        [STAGE_ATTRIBUTE_NAME]: STAGE_FIXTURE,
      },
      isCreatingEntry: true,
      layout: { uid: 'api::articles:articles' },
    });

    const { queryByRole } = setup();
    const select = queryByRole('combobox');

    expect(select).not.toBeInTheDocument();
  });

  it('renders an enabled select input, if the entity is edited', () => {
    useCMEditViewDataManager.mockReturnValue({
      initialData: {
        [STAGE_ATTRIBUTE_NAME]: STAGE_FIXTURE,
      },
      isCreatingEntry: false,
      layout: { uid: 'api::articles:articles' },
    });

    const { queryByRole } = setup();
    const select = queryByRole('combobox');

    expect(select).toBeInTheDocument();
  });

  it('renders a select input, if a workflow stage is assigned to the entity', async () => {
    useCMEditViewDataManager.mockReturnValue({
      initialData: {
        [STAGE_ATTRIBUTE_NAME]: STAGE_FIXTURE,
      },
      isCreatingEntry: false,
      layout: { uid: 'api::articles:articles' },
    });

    const { getByRole, getByText, user } = setup();

    expect(getByRole('combobox')).toBeInTheDocument();
    expect(getByText('Stage 1')).toBeInTheDocument();

    await user.click(getByRole('combobox'));

    expect(getByText('Stage 2')).toBeInTheDocument();
  });
});
