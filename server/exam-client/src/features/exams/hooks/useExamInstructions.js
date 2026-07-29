import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { useAuth } from '../../../hooks/useAuth';

export const useExamInstructions = (scheduleId) => {
  const { baseToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['examInstructions', scheduleId, baseToken],
    queryFn: async () => {
      const response = await examsApi.getInstructions(scheduleId, baseToken);
      return response.data;
    },
    enabled: Boolean(isAuthenticated && baseToken && scheduleId),
  });
};
