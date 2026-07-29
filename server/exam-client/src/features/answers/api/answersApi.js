import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';

export const answersApi = {
  /**
   * Save single answer payload idempotently
   * Requires Elevated Exam Token explicitly passed.
   */
  saveAnswer: async (elevatedToken, submission) => {
    return axiosClient.post(
      API_ENDPOINTS.SAVE_ANSWER,
      {
        question_id: submission.question_id,
        selected_option_id: submission.selected_option_id || null,
        answer_text: submission.answer_text || null,
      },
      {
        headers: elevatedToken ? { Authorization: `Bearer ${elevatedToken}` } : {},
      }
    );
  },
};
