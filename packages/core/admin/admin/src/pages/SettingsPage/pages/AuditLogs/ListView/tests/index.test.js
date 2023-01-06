import React from 'react';
import { Router } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { createMemoryHistory } from 'history';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, lightTheme } from '@strapi/design-system';
import { TrackingProvider } from '@strapi/helper-plugin';
import ListView from '../index';
import { TEST_DATA, getBigTestData } from './utils/data';

const history = createMemoryHistory();
const user = userEvent.setup();

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

  it('should show pagination and be on page 1 on first render', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        results: getBigTestData(15),
        pagination: {
          page: 1,
          pageSize: 10,
          pageCount: 2,
          total: 15,
        },
      },
      isLoading: false,
    });

    const { container } = render(App);

    const pagination = await waitFor(() => container.querySelector('nav[aria-label="pagination"]'));

    expect(pagination).toBeInTheDocument();
    expect(pagination.querySelectorAll('ul li')[1].querySelector('a')).toHaveTextContent('1');
    expect(pagination.querySelectorAll('ul li')[1].querySelector('a')).toHaveClass('active');
  });

  it('should add the right query params when page 2 is clicked', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        results: getBigTestData(15),
        pagination: {
          page: 1,
          pageSize: 10,
          pageCount: 2,
          total: 15,
        },
      },
      isLoading: false,
    });

    const { container } = render(App);

    const pagination = await waitFor(() => container.querySelector('nav[aria-label="pagination"]'));

    await user.click(pagination.querySelectorAll('ul li')[2].querySelector('a'));
    expect(history.location.search).toEqual('?page=2');
  });

  it('should show 20 elements if pageSize is 20', async () => {
    history.location.search = '?pageSize=20';

    mockUseQuery.mockReturnValue({
      data: {
        results: getBigTestData(20),
        pagination: {
          page: 1,
          pageSize: 20,
          pageCount: 1,
          total: 20,
        },
      },
      isLoading: false,
    });

    const { container } = render(App);

    const rows = await waitFor(() => container.querySelector('tbody').querySelectorAll('tr'));
    expect(rows.length).toEqual(20);
  });
});
