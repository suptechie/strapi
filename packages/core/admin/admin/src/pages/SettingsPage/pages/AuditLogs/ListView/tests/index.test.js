import React from 'react';
import { Router } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { createMemoryHistory } from 'history';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, lightTheme } from '@strapi/design-system';
import { TrackingProvider } from '@strapi/helper-plugin';
// import { useFetchClient } from '../../../../../../hooks';
import ListView from '../index';

const history = createMemoryHistory();
const user = userEvent.setup();

const TEST_DATA = [
  {
    id: 1,
    action: 'role.create',
    date: '2022-12-27T10:02:06.598Z',
    user: {
      id: 1,
      fullname: 'test user',
      email: 'test@test.com',
    },
  },
  {
    id: 2,
    action: 'role.delete',
    date: '2022-12-27T16:28:08.977Z',
    user: {
      id: 1,
      fullname: 'test user',
      email: 'test@test.com',
    },
  },
  {
    id: 3,
    action: 'entry.create',
    date: '2022-12-27T17:34:00.673Z',
    user: null,
  },
  {
    id: 4,
    action: 'admin.logout',
    date: '2022-12-27T17:51:04.146Z',
    user: {
      id: 1,
      fullname: 'test user',
      email: 'test@test.com',
    },
  },
];

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useNotification: jest.fn(),
  useFocusWhenNavigate: jest.fn(),
  useRBAC: jest.fn(() => ({
    allowedActions: { canRead: true },
  })),
}));

const mockUseQuery = jest.fn();
jest.mock('react-query', () => {
  const actual = jest.requireActual('react-query');

  return {
    ...actual,
    useQuery: () => mockUseQuery(),
  };
});

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const App = (
  <QueryClientProvider client={client}>
    <TrackingProvider>
      <ThemeProvider theme={lightTheme}>
        <IntlProvider locale="en" messages={{}} defaultLocale="en" textComponent="span">
          <Router history={history}>
            <ListView />
          </Router>
        </IntlProvider>
      </ThemeProvider>
    </TrackingProvider>
  </QueryClientProvider>
);

describe('ADMIN | Pages | AUDIT LOGS | ListView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should render page with right header details', () => {
    mockUseQuery.mockReturnValue({
      data: {
        results: [],
      },
      isLoading: false,
    });

    render(App);
    const title = screen.getByText(/audit logs/i);
    expect(title).toBeInTheDocument();
    const subTitle = screen.getByText(
      /logs of all the activities that happened in your environment/i
    );
    expect(subTitle).toBeInTheDocument();
  });

  it('should show a list of audit logs with all actions', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        results: TEST_DATA,
      },
      isLoading: false,
    });
    render(App);

    await waitFor(() => {
      expect(screen.getByText('Create role')).toBeInTheDocument();
      expect(screen.getByText('Delete role')).toBeInTheDocument();
      expect(screen.getByText('Create entry')).toBeInTheDocument();
      expect(screen.getByText('Admin logout')).toBeInTheDocument();
    });
  });

  it('should open a modal when clicked on a table row and close modal when clicked', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        results: TEST_DATA,
      },
      isLoading: false,
    });

    const { container } = render(App);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const rows = container.querySelector('tbody').querySelectorAll('tr');
    await user.click(rows[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const label = screen.getByText(/close the modal/i);
    const closeButton = label.closest('button');
    await user.click(closeButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
