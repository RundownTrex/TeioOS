import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { useAuth } from '../../../hooks/useAuth';

export const useExamReview = (scheduleId) => {
  const { baseToken } = useAuth();

  return useQuery({
    queryKey: ['examReview', scheduleId, baseToken],
    queryFn: async () => {
      if (!scheduleId) return null;
      const response = await examsApi.getExamReview(scheduleId, baseToken);
      // axiosClient unwraps response.data, so response is { success, message, data }.
      // response.data holds the ExamReviewResponse payload.
      return response?.data || response;
    },
    enabled: Boolean(scheduleId && baseToken),
    staleTime: 5 * 60 * 1000,
  });
};
