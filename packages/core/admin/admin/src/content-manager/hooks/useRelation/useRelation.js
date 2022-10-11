import { useState } from 'react';
import { useInfiniteQuery } from 'react-query';

import { axiosInstance } from '../../../core/utils';

export const useRelation = (cacheKey, { relation, search }) => {
  const [searchParams, setSearchParams] = useState({});

  const fetchRelations = async ({ pageParam = 1 }) => {
    try {
      const { data } = await axiosInstance.get(relation?.endpoint, {
        params: {
          ...(relation.pageParams ?? {}),
          page: pageParam,
        },
      });

      return data;
    } catch (err) {
      return null;
    }
  };

  const fetchSearch = async ({ pageParam = 1 }) => {
    try {
      const { data } = await axiosInstance.get(search.endpoint, {
        params: {
          ...(search.pageParams ?? {}),
          ...searchParams,
          page: pageParam,
        },
      });

      return data;
    } catch (err) {
      return null;
    }
  };

  const relationsRes = useInfiniteQuery(['relation', cacheKey], fetchRelations, {
    cacheTime: 0,
    enabled: relation.enabled,
    getNextPageParam(lastPage) {
      // the API may send an empty 204 response
      if (!lastPage || lastPage.pagination.page >= lastPage.pagination.pageCount) {
        return undefined;
      }

      // eslint-disable-next-line consistent-return
      return lastPage.pagination.page + 1;
    },
    select: (data) => ({
      pages: data.pages.map((page) => ({ ...page, results: [...(page.results ?? [])].reverse() })),
    }),
  });

  const searchRes = useInfiniteQuery(
    ['relation', cacheKey, 'search', JSON.stringify(searchParams)],
    fetchSearch,
    {
      enabled: Object.keys(searchParams).length > 0,
      getNextPageParam(lastPage) {
        if (lastPage.pagination.page >= lastPage.pagination.pageCount) {
          return undefined;
        }

        // eslint-disable-next-line consistent-return
        return lastPage.pagination.page + 1;
      },
    }
  );

  const searchFor = (term, options = {}) => {
    setSearchParams({
      ...options,
      _q: term,
    });
  };

  return { relations: relationsRes, search: searchRes, searchFor };
};
