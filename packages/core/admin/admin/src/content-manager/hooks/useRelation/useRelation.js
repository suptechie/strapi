import { useState } from 'react';
import { useInfiniteQuery } from 'react-query';

import { axiosInstance } from '../../../core/utils';

export const useRelation = (cacheKey, { relation, search }) => {
  const [searchTerm, setSearchTerm] = useState(null);

  const fetchRelations = async ({ pageParam = 1 }) => {
    try {
      const { data } = await axiosInstance.get(relation?.endpoint, {
        ...(relation.pageParams ?? {}),
        page: pageParam,
      });

      if (relation?.onLoad) {
        relation.onLoad(data);
      }

      return data;
    } catch (err) {
      return null;
    }
  };

  const fetchSearch = async ({ pageParam = 1 }) => {
    const { data } = await axiosInstance.get(search.endpoint, {
      ...(search.pageParams ?? {}),
      page: pageParam,
    });

    return data;
  };

  const relationsRes = useInfiniteQuery(['relation', cacheKey], fetchRelations, {
    enabled: !!relation?.endpoint,
    getNextPageParam(lastPage) {
      if (lastPage.pagination.page + 1 === lastPage.pagination.total) {
        return undefined;
      }

      // eslint-disable-next-line consistent-return
      return lastPage.pagination.page + 1;
    },
  });

  const searchRes = useInfiniteQuery(['relation', cacheKey, 'search', searchTerm], fetchSearch, {
    enabled: !!searchTerm,
    getNextPageParam(lastPage) {
      if (lastPage.pagination.page + 1 === lastPage.pagination.total) {
        return undefined;
      }

      // eslint-disable-next-line consistent-return
      return lastPage.pagination.page + 1;
    },
  });

  const searchFor = (term) => {
    searchRes.remove();
    setSearchTerm(term);
  };

  return { relations: relationsRes, search: searchRes, searchFor };
};
