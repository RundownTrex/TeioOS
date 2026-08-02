import { useQuery } from '@tanstack/react-query';
import { subjectsApi } from '../api/subjectsApi';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION, QUERY_DEFAULTS } from '../../../utils/constants';

/**
 * Reference query: loads all subjects once (max page size) for name lookups
 * and Select options. Shared across modules via the query key, so it is
 * fetched only once.
 */
export const useSubjectsReference = () =>
  useQuery({
    queryKey: queryKeys.subjects.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE }),
    queryFn: ({ signal }) =>
      subjectsApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_REFERENCE_MS,
  });

/**
 * Builds an id → subject lookup from a subjects list response.
 */
export const buildSubjectNameMap = (data) => {
  const map = new Map();
  data?.items?.forEach((item) => map.set(item.id, item));
  return map;
};

/**
 * Builds [{ value, label }] options sorted by name.
 */
export const buildSubjectOptions = (data) =>
  (data?.items ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => ({ value: item.id, label: item.name }));
