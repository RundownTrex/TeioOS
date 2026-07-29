import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { useAuth } from '../../../hooks/useAuth';

export const useAssignedExams = () => {
  const { baseToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['assignedExams', baseToken],
    queryFn: async () => {
      const response = await examsApi.getAssignedExams(baseToken);
      return response.data;
    },
    enabled: Boolean(isAuthenticated && baseToken),
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // Poll every 5 seconds for kiosk real-time auto-unlocking
    staleTime: 1000 * 5, // 5 seconds
  });
};
