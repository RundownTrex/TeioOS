import { useMutation } from '@tanstack/react-query';
import { answersApi } from '../api/answersApi';
import { useExam } from '../../../hooks/useExam';

export const useSaveAnswer = () => {
  const { elevatedToken, setAnswer } = useExam();

  return useMutation({
    mutationFn: async (submission) => {
      // submission: { question_id, selected_option_id, answer_text }
      return answersApi.saveAnswer(elevatedToken, submission);
    },
    onMutate: (submission) => {
      // Optimistically update local answer state in ExamContext
      setAnswer(submission.question_id, {
        selected_option_id: submission.selected_option_id,
        answer_text: submission.answer_text,
        sync_status: 'SAVING',
      });
    },
    onSuccess: (_, submission) => {
      setAnswer(submission.question_id, { sync_status: 'SAVED' });
    },
    onError: (_, submission) => {
      setAnswer(submission.question_id, { sync_status: 'ERROR' });
    },
  });
};
