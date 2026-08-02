import { useQuery } from '@tanstack/react-query';
import { classesApi } from '../api/classesApi';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION, QUERY_DEFAULTS } from '../../../utils/constants';

/**
 * Reference query: loads all classes once (max page size) for name lookups
 * and Select options on student/exam pages. Shared across modules via the
 * query key, so it is fetched only once.
 */
export const useClassesReference = () =>
  useQuery({
    queryKey: queryKeys.classes.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE }),
    queryFn: ({ signal }) =>
      classesApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_REFERENCE_MS,
  });

/**
 * Builds an id → class lookup from a classes list response.
 */
export const buildClassNameMap = (data) => {
  const map = new Map();
  data?.items?.forEach((item) => map.set(item.id, item));
  return map;
};

/**
 * Builds [{ value, label }] options sorted by name (server orders classes
 * newest-first, which is wrong for a picker). Labels include the department
 * name when available to disambiguate same-named classes.
 */
export const buildClassOptions = (data, departmentNameMap) =>
  (data?.items ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item) => {
      const departmentName = departmentNameMap.get(item.department_id);
      return {
        value: item.id,
        label: departmentName ? `${item.name} · ${departmentName}` : item.name,
      };
    });
