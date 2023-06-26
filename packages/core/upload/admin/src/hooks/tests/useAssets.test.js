import React from 'react';

import { lightTheme, ThemeProvider, useNotifyAT } from '@strapi/design-system';
import { NotificationsProvider, useFetchClient, useNotification } from '@strapi/helper-plugin';
import { act, renderHook, waitFor } from '@testing-library/react';
import { stringify } from 'qs';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import { useAssets } from '../useAssets';

const notifyStatusMock = jest.fn();

jest.mock('@strapi/design-system', () => ({
  ...jest.requireActual('@strapi/design-system'),
  useNotifyAT: () => ({
    notifyStatus: notifyStatusMock,
  }),
}));

const notificationStatusMock = jest.fn();

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useNotification: () => notificationStatusMock,
  useFetchClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({
      data: {
        id: 1,
      },
    }),
  }),
}));

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// eslint-disable-next-line react/prop-types
function ComponentFixture({ children }) {
  return (
    <Router>
      <Route>
        <QueryClientProvider client={client}>
          <ThemeProvider theme={lightTheme}>
            <NotificationsProvider>
              <IntlProvider locale="en" messages={{}}>
                {children}
              </IntlProvider>
            </NotificationsProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Route>
    </Router>
  );
}

function setup(...args) {
  return new Promise((resolve) => {
    act(() => {
      resolve(renderHook(() => useAssets(...args), { wrapper: ComponentFixture }));
    });
  });
}

describe('useAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches data from the right URL if no query was set', async () => {
    await setup();

    const { get } = useFetchClient();

    const expected = {
      filters: {
        $and: [
          {
            folder: {
              id: {
                $null: true,
              },
            },
          },
        ],
      },
    };

    await waitFor(() =>
      expect(get).toBeCalledWith(
        `/upload/files${stringify(expected, { encode: false, addQueryPrefix: true })}`
      )
    );
  });

  test('fetches data from the right URL if a query was set', async () => {
    const { result } = await setup({ query: { folder: 1 } });

    await waitFor(() => result.current.isSuccess);
    const { get } = useFetchClient();

    const expected = {
      filters: {
        $and: [
          {
            folder: {
              id: 1,
            },
          },
        ],
      },
    };

    await waitFor(() =>
      expect(get).toBeCalledWith(
        `/upload/files${stringify(expected, { encode: false, addQueryPrefix: true })}`
      )
    );
  });

  test('allows to merge filter query params using filters.$and', async () => {
    const { result } = await setup({
      query: { folder: 5, filters: { $and: [{ something: 'true' }] } },
    });

    await waitFor(() => result.current.isSuccess);
    const { get } = useFetchClient();

    const expected = {
      filters: {
        $and: [
          {
            something: true,
          },
          {
            folder: {
              id: 5,
            },
          },
        ],
      },
    };

    await waitFor(() =>
      expect(get).toBeCalledWith(
        `/upload/files${stringify(expected, { encode: false, addQueryPrefix: true })}`
      )
    );
  });

  test('does not use folder filter in params if _q', async () => {
    const { result } = await setup({
      query: { folder: 5, _q: 'something', filters: { $and: [{ something: 'true' }] } },
    });

    await waitFor(() => result.current.isSuccess);
    const { get } = useFetchClient();

    const expected = {
      filters: {
        $and: [
          {
            something: true,
          },
        ],
      },
      _q: 'something',
    };

    await waitFor(() =>
      expect(get).toBeCalledWith(
        `/upload/files${stringify(expected, { encode: false, addQueryPrefix: true })}`
      )
    );
  });

  test('correctly encodes the search query _q', async () => {
    const _q = 'something&else';
    const { result } = await setup({
      query: { folder: 5, _q, filters: { $and: [{ something: 'true' }] } },
    });

    await waitFor(() => result.current.isSuccess);
    const { get } = useFetchClient();

    const expected = {
      filters: {
        $and: [
          {
            something: true,
          },
        ],
      },
      _q: encodeURIComponent(_q),
    };

    await waitFor(() =>
      expect(get).toBeCalledWith(
        `/upload/files${stringify(expected, { encode: false, addQueryPrefix: true })}`
      )
    );
  });

  test('it does not fetch, if skipWhen is set', async () => {
    const { result } = await setup({ skipWhen: true });

    await waitFor(() => result.current.isSuccess);

    const { get } = useFetchClient();

    expect(get).toBeCalledTimes(0);
  });

  test('calls notifyStatus in case of success', async () => {
    const { notifyStatus } = useNotifyAT();
    const toggleNotification = useNotification();
    const { result } = await setup({});

    await waitFor(() => result.current.isSuccess);
    await waitFor(() => expect(notifyStatus).toBeCalledWith('The assets have finished loading.'));

    expect(toggleNotification).toBeCalledTimes(0);
  });

  test('calls toggleNotification in case of error', async () => {
    const originalConsoleError = console.error;
    console.error = jest.fn();
    const { get } = useFetchClient();

    get.mockRejectedValueOnce(new Error('Jest mock error'));

    const { notifyStatus } = useNotifyAT();
    const toggleNotification = useNotification();
    const { result } = await setup({});

    await waitFor(() => result.current.isSuccess);
    await waitFor(() => expect(toggleNotification).toBeCalled());

    expect(notifyStatus).not.toBeCalled();

    console.error = originalConsoleError;
  });

  it('should filter out any assets without a name', async () => {
    const { get } = useFetchClient();

    get.mockReturnValue({
      data: {
        results: [
          {
            name: null,
            mime: 'image/jpeg',
            ext: 'jpg',
          },
          {
            name: 'test',
            mime: 'image/jpeg',
            ext: 'jpg',
          },
        ],
      },
    });

    const { result } = await setup({});

    await waitFor(() =>
      expect(result.current.data.results).toEqual([
        {
          name: 'test',
          mime: 'image/jpeg',
          ext: 'jpg',
        },
      ])
    );
  });

  it('should set mime and ext to strings as defaults if they are nullish', async () => {
    const { get } = useFetchClient();

    get.mockReturnValue({
      data: {
        results: [
          {
            name: 'test 1',
            mime: null,
            ext: 'jpg',
          },
          {
            name: 'test 2',
            mime: 'image/jpeg',
            ext: null,
          },
          {
            name: 'test 3',
            mime: null,
            ext: null,
          },
          {
            name: 'test 4',
            mime: 'image/jpeg',
            ext: 'jpg',
          },
        ],
      },
    });

    const { result } = await setup({});

    await waitFor(() =>
      expect(result.current.data.results).toMatchInlineSnapshot(`
    [
      {
        "ext": "jpg",
        "mime": "",
        "name": "test 1",
      },
      {
        "ext": "",
        "mime": "image/jpeg",
        "name": "test 2",
      },
      {
        "ext": "",
        "mime": "",
        "name": "test 3",
      },
      {
        "ext": "jpg",
        "mime": "image/jpeg",
        "name": "test 4",
      },
    ]
  `)
    );
  });
});
