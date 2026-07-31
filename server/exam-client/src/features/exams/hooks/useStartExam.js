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
      const questionsResponse = await examsApi.getQuestions(scheduleId, startData.token);
      
      return {
        startData,
        questionsData: questionsResponse.data,
      };
    },
    onSuccess: ({ startData, questionsData }, scheduleId) => {
      // Compute remaining seconds from server-authoritative expires_at
      let remainingSeconds = 0;
      if (startData.server_current_time && startData.expires_at) {
        const serverNowMs = new Date(startData.server_current_time).getTime();
        const endMs = new Date(startData.expires_at).getTime();
        remainingSeconds = Math.max(0, Math.floor((endMs - serverNowMs) / 1000));
      }

      initExamSession({
        token: startData.access_token,
        scheduleId,
        questionsData: questionsData?.questions || [],
        remainingSeconds,
      });
    },
  });
};
