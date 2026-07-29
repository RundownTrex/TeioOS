import { useQuery } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { useExam } from '../../../hooks/useExam';

export const useExamQuestions = (scheduleId) => {
  const { elevatedToken, isExamActive } = useExam();

  return useQuery({
    queryKey: ['examQuestions', scheduleId, elevatedToken],
    queryFn: async () => {
      const response = await examsApi.getQuestions(scheduleId, elevatedToken);
      return response.data;
    },
    enabled: Boolean(isExamActive && scheduleId && elevatedToken),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    retry: 2,
  });
};
