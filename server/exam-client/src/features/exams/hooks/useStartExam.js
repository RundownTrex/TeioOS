import { useMutation } from '@tanstack/react-query';
import { examsApi } from '../api/examsApi';
import { useAuth } from '../../../hooks/useAuth';
import { useExam } from '../../../hooks/useExam';

export const useStartExam = () => {
  const { baseToken } = useAuth();
  const { initExamSession } = useExam();

  return useMutation({
    mutationFn: async (scheduleId) => {
      const response = await examsApi.startExam(scheduleId, baseToken);
      const startData = response.data; // ExamStartResponse

      // Fetch questions using newly acquired elevated token
      const questionsResponse = await examsApi.getQuestions(scheduleId, startData.access_token);

      return {
        startData,
        questionsData: questionsResponse.data,
      };
    },
    onSuccess: ({ startData, questionsData }, scheduleId) => {
      initExamSession({
        token: startData.access_token,
        scheduleId,
        questionsData: questionsData?.questions || [],
        session: startData.session,
        serverCurrentTime: startData.server_current_time,
      });
    },
  });
};
