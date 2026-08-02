import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { queryKeys } from '../../../utils/queryKeys';
import { PAGINATION, QUERY_DEFAULTS } from '../../../utils/constants';

/**
 * Reference query: loads all exams once (max page size) for title/subject
 * lookups and Select options. Shared across modules via the query key, so
 * it is fetched only once. Exams > 100 are served by the detail endpoint.
 */
export const useExamsReference = () =>
  useQuery({
    queryKey: queryKeys.exams.list.by({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE }),
    queryFn: ({ signal }) =>
      examsApi.list({ page: 1, pageSize: PAGINATION.MAX_PAGE_SIZE, signal }),
    staleTime: QUERY_DEFAULTS.STALE_TIME_REFERENCE_MS,
  });

/**
 * Builds an id → exam lookup from an exams list response.
 */
export const buildExamMap = (data) => {
  const map = new Map();
  data?.items?.forEach((item) => map.set(item.id, item));
  return map;
};

/**
 * Display title with subject fallback (mirrors ExamsListPage).
 */
export const buildExamOptions = (data, subjectNames) =>
  (data?.items ?? [])
    .slice()
    .sort((a, b) => {
      const nameA = a.title || subjectNames.get(a.subject_id)?.name || '';
      const nameB = b.title || subjectNames.get(b.subject_id)?.name || '';
      return nameA.localeCompare(nameB);
    })
    .map((item) => ({
      value: item.id,
      label: item.title || subjectNames.get(item.subject_id)?.name || 'Untitled exam',
    }));
