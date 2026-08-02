import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '../api/departmentsApi';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION, QUERY_DEFAULTS } from '../../../utils/constants';

/**
 * Reference query: loads all departments once (max page size) for name
 * lookups and Select options on classes/subjects pages. Shared across
 * modules via the query key, so it is fetched only once.
 */
export const useDepartmentsReference = () =>
  useQuery({
    queryKey: queryKeys.departments.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE }),
    queryFn: ({ signal }) =>
      departmentsApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_REFERENCE_MS,
  });

/**
 * Builds an id → name lookup from a departments list response.
 */
export const buildDepartmentNameMap = (data) => {
  const map = new Map();
  data?.items?.forEach((item) => map.set(item.id, item.name));
  return map;
};

/**
 * Builds [{ value, label }] options (sorted by name — server order) for Select.
 */
export const buildDepartmentOptions = (data) =>
  (data?.items ?? []).map((item) => ({ value: item.id, label: item.name }));
