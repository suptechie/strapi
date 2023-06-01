import React from 'react';
import { QueryClientProvider, QueryClient } from 'react-query';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useFetchClient } from '@strapi/helper-plugin';
import { useRelation } from '../useRelation';

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useFetchClient: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({
      data: {
        results: [
          { id: 2, name: 'newest', publishedAt: null },
          { id: 1, name: 'oldest', publishedAt: null },
        ],
        pagination: { page: 1, pageCount: 10 },
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
const ComponentFixture = ({ children }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const cacheKey = ['useRelation-cache-key'];
function setup(args) {
  return new Promise((resolve) => {
    act(() => {
      resolve(
        renderHook(
          () =>
            useRelation(cacheKey, {
              relation: {
                enabled: true,
                endpoint: '/',
                pageParams: {
                  limit: 10,
                  ...(args?.relation?.pageParams ?? {}),
                },
                normalizeArguments: {
                  mainFieldName: 'name',
                  shouldAddLink: false,
                  targetModel: 'api::tag.tag',
                },
                ...(args?.relation ?? {}),
              },

              search: {
                endpoint: '/',
                pageParams: {
                  limit: 10,
                  ...(args?.search?.pageParams ?? {}),
                },
                ...(args?.search ?? {}),
              },
            }),
          { wrapper: ComponentFixture }
        )
      );
    });
  });
}

describe('useRelation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetch relations and calls onLoadRelationsCallback', async () => {
    const onLoadMock = jest.fn();
    await setup({
      relation: {
        onLoad: onLoadMock,
      },
    });

    const { get } = useFetchClient();

    await waitFor(() => expect(get).toBeCalledTimes(1));

    expect(get).toBeCalledWith('/', {
      params: {
        limit: 10,
        page: 1,
      },
    });

    await waitFor(() =>
      expect(onLoadMock).toBeCalledWith([
        expect.objectContaining({ id: 1 }),
        expect.objectContaining({ id: 2 }),
      ])
    );
  });

  test('fetch and normalize relations for xToOne', async () => {
    const onLoadMock = jest.fn();

    const FIXTURE = {
      id: 1,
      title: 'xToOne relation',
    };

    useFetchClient().get = jest.fn().mockResolvedValueOnce({
      data: {
        data: FIXTURE,
      },
    });

    const { result } = await setup({
      relation: {
        onLoad: onLoadMock,
      },
    });

    await waitFor(() => expect(result.current.relations.isSuccess).toBe(true));

    await waitFor(() => expect(onLoadMock).toBeCalledWith([expect.objectContaining({ id: 1 })]));
  });

  test('fetch relations with different limit', async () => {
    await setup({
      relation: { pageParams: { limit: 5 } },
    });

    const { get } = useFetchClient();

    await waitFor(() => {
      expect(get).toBeCalledWith(expect.any(String), {
        params: {
          limit: 5,
          page: expect.any(Number),
        },
      });
    });
  });

  test('does not fetch relations if it was not enabled', async () => {
    await setup({ relation: { enabled: false } });
    const { get } = useFetchClient();

    expect(get).not.toBeCalled();
  });

  test('fetch relations', async () => {
    const { result } = await setup();

    await waitFor(() => {
      expect(result.current.relations.isSuccess).toBe(true);
    });

    const { get } = useFetchClient();

    expect(result.current.relations.isSuccess).toBe(true);
    expect(get).toBeCalledTimes(1);
    expect(get).toBeCalledWith('/', {
      params: {
        limit: 10,
        page: 1,
      },
    });
  });

  test('fetch relations next page, if there is one', async () => {
    useFetchClient().get = jest.fn().mockResolvedValueOnce({
      data: {
        results: [],
        pagination: {
          page: 1,
          pageCount: 3,
        },
      },
    });

    const { get } = useFetchClient();

    const { result } = await setup();

    await waitFor(() => expect(result.current.relations.isLoading).toBe(false));

    act(() => {
      result.current.relations.fetchNextPage();
    });

    expect(get).toBeCalledTimes(2);
    expect(get).toHaveBeenNthCalledWith(1, expect.any(String), {
      params: {
        limit: expect.any(Number),
        page: 1,
      },
    });
    expect(get).toHaveBeenNthCalledWith(2, expect.any(String), {
      params: {
        limit: expect.any(Number),
        page: 2,
      },
    });
  });

  test("does not fetch relations next page, if there isn't one", async () => {
    useFetchClient().get = jest.fn().mockResolvedValueOnce({
      data: {
        results: [],
        pagination: {
          page: 1,
          pageCount: 1,
        },
      },
    });

    const { get } = useFetchClient();

    const { result } = await setup();

    await waitFor(() => {
      expect(get).toBeCalledTimes(1);
    });

    act(() => {
      result.current.relations.fetchNextPage();
    });

    await waitFor(() => expect(get).toBeCalledTimes(1));
  });

  test('does not fetch search by default', async () => {
    const { result } = await setup();

    await waitFor(() => {
      expect(result.current.search.isLoading).toBe(false);
    });
  });

  test('does fetch search results once a term was provided', async () => {
    const { result } = await setup();

    await waitFor(() => expect(result.current).toBeTruthy());

    const spy = jest
      .fn()
      .mockResolvedValue({ data: { results: [], pagination: { page: 1, pageCount: 2 } } });
    useFetchClient().get = spy;

    act(() => {
      result.current.searchFor('something');
    });

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });

    expect(spy).toBeCalledWith('/', { params: { _q: 'something', limit: 10, page: 1 } });
  });

  test('does fetch search results with a different limit', async () => {
    const { result } = await setup({
      search: { pageParams: { limit: 5 } },
    });

    await waitFor(() => expect(result.current).toBeTruthy());

    const spy = jest
      .fn()
      .mockResolvedValue({ data: { values: [], pagination: { page: 1, pageCount: 2 } } });
    useFetchClient().get = spy;

    act(() => {
      result.current.searchFor('something');
    });

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });

    expect(spy).toBeCalledWith(expect.any(String), {
      params: {
        _q: 'something',
        limit: 5,
        page: expect.any(Number),
      },
    });
  });

  test('fetch search next page, if there is one', async () => {
    const { result } = await setup();

    const spy = jest
      .fn()
      .mockResolvedValue({ data: { results: [], pagination: { page: 1, pageCount: 2 } } });
    useFetchClient().get = spy;

    act(() => {
      result.current.searchFor('something');
    });

    await waitFor(() => expect(result.current.search.isLoading).toBe(false));

    act(() => {
      result.current.search.fetchNextPage();
    });

    await waitFor(() => expect(result.current.search.isLoading).toBe(false));

    expect(spy).toBeCalledTimes(2);

    expect(spy).toHaveBeenNthCalledWith(1, expect.any(String), {
      params: {
        _q: 'something',
        limit: expect.any(Number),
        page: 1,
      },
    });
    expect(spy).toHaveBeenNthCalledWith(2, expect.any(String), {
      params: {
        _q: 'something',
        limit: expect.any(Number),
        page: 2,
      },
    });
  });

  test("does not fetch search next page, if there isn't one", async () => {
    const { result } = await setup();

    const spy = jest.fn().mockResolvedValueOnce({
      data: { results: [], pagination: { page: 1, pageCount: 1 } },
    });

    useFetchClient().get = spy;

    act(() => {
      result.current.searchFor('something');
    });

    await waitFor(() => expect(result.current.search.isLoading).toBe(false));

    act(() => {
      result.current.search.fetchNextPage();
    });

    await waitFor(() => {
      expect(spy).toBeCalledTimes(1);
    });
  });
});
