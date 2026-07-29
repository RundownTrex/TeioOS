import { useMutation } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { useExam } from '../../../hooks/useExam';

export const useSubmitExam = () => {
  const { elevatedToken, activeScheduleId, clearExamSession } = useExam();

  return useMutation({
    mutationFn: async ({ isAutoSubmitted = false } = {}) => {
      const response = await examsApi.submitExam(activeScheduleId, elevatedToken, isAutoSubmitted);
      return response.data;
    },
    onSuccess: () => {
      clearExamSession();
    },
  });
};
