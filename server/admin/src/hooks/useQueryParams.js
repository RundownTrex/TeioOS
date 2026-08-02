import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PAGINATION } from '../utils/constants';

/**
 * URL-synced pagination and filters for list pages.
 *
 * Page, pageSize and the configured filter keys are read from and written
 * to the URL search string, so refresh, deep-link, and back-button behave
 * predictably. Filtering and pagination therefore never live in React state.
 *
 * @param {object} options
 * @param {number} [options.defaultPageSize=20] default page size
 * @param {string[]} [options.filterKeys=[]] search-param keys treated as filters
 */
export const useQueryParams = ({ defaultPageSize = PAGINATION.DEFAULT_PAGE_SIZE, filterKeys = [] } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = useMemo(() => {
    const parsed = parseInt(searchParams.get('page'), 10);
    return Number.isNaN(parsed) || parsed < PAGINATION.DEFAULT_PAGE ? PAGINATION.DEFAULT_PAGE : parsed;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const parsed = parseInt(searchParams.get('page_size'), 10);
    return Number.isNaN(parsed) || parsed < 1 ? defaultPageSize : Math.min(parsed, PAGINATION.MAX_PAGE_SIZE);
  }, [searchParams, defaultPageSize]);

  const filters = useMemo(() => {
    const result = {};
    filterKeys.forEach((key) => {
      const value = searchParams.get(key);
      if (value !== null && value !== '') result[key] = value;
    });
    return result;
  }, [searchParams, filterKeys]);

  const setParams = useCallback(
    (patch, { replace = true } = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(patch).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          });
          return next;
        },
        { replace }
      );
    },
    [setSearchParams]
  );

  const setPage = useCallback(
    (nextPage) => setParams({ page: nextPage <= 1 ? undefined : nextPage }),
    [setParams]
  );

  const setPageSize = useCallback(
    (nextPageSize) => setParams({ page_size: nextPageSize, page: undefined }),
    [setParams]
  );

  const setFilter = useCallback(
    (key, value) => setParams({ [key]: value, page: undefined }),
    [setParams]
  );

  const clearFilters = useCallback(() => {
    const patch = {};
    filterKeys.forEach((key) => {
      patch[key] = undefined;
    });
    setParams({ ...patch, page: undefined });
  }, [filterKeys, setParams]);

  return { page, pageSize, filters, setPage, setPageSize, setFilter, setParams, clearFilters };
};

export default useQueryParams;
