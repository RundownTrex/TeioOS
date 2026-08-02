import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { useAuth } from '../../../hooks/useAuth';

/**
 * Fetches the candidate's personal exam session snapshot (assignment status +
 * authoritative server time) from the backend. Used for periodic timer
 * synchronization and refresh/reconnect recovery.
 */
export const useExamSession = (scheduleId, { refetchInterval = false, refetchOnWindowFocus = true } = {}) => {
  const { baseToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['examSession', scheduleId, baseToken],
    queryFn: async () => {
      const response = await examsApi.getSession(scheduleId, baseToken);
      return response.data;
    },
    enabled: Boolean(isAuthenticated && baseToken && scheduleId),
    refetchInterval,
    refetchOnWindowFocus,
    staleTime: 1000 * 15,
    retry: 2,
  });
};

export default useExamSession;
