import { getFetchClient, type FetchOptions, type FetchError } from '@strapi/admin/strapi-admin';

export interface QueryArguments<TSend> {
  url: string;
  method: 'PUT' | 'GET' | 'POST' | 'DELETE';
  data?: TSend;
  config?: FetchOptions;
}

const fetchBaseQuery = async <TData = unknown, TSend = unknown>({
  url,
  method,
  data,
  config,
}: QueryArguments<TSend>) => {
  try {
    const { get, post, del, put } = getFetchClient();

    if (method === 'POST') {
      const result = await post<TData, TSend>(url, data, config);
      return { data: result.data };
    }

    if (method === 'DELETE') {
      const result = await del<TData>(url, config);
      return { data: result.data };
    }

    if (method === 'PUT') {
      const result = await put<TData>(url, data, config);
      return { data: result.data };
    }

    /**
     * Default is GET.
     */
    const result = await get<TData>(url, config);

    return { data: result.data };
  } catch (error) {
    const err = error as FetchError;
    /**
     * Handle error of type FetchError
     *
     * This format mimics what we want from an FetchError which is what the
     * rest of the app works with, except this format is "serializable" since
     * it goes into the redux store.
     *
     * NOTE – passing the whole response will highlight this "serializability" issue.
     */
    return {
      error: {
        status: err.status,
        code: err.code,
        response: {
          data: err.response?.data,
        },
      },
    };
  }
};

export { fetchBaseQuery };
