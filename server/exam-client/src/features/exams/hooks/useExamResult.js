import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { useAuth } from '../../../hooks/useAuth';

export const useExamResult = (scheduleId) => {
  const { baseToken } = useAuth();

  return useQuery({
    queryKey: ['examResult', scheduleId, baseToken],
    queryFn: async () => {
      if (!scheduleId) return null;
      const response = await examsApi.getExamResult(scheduleId, baseToken);
      return response?.data || response;
    },
    enabled: Boolean(scheduleId && baseToken),
    staleTime: 5 * 60 * 1000,
  });
};

export default useExamResult;
