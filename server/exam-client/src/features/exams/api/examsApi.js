import axiosClient, { baseURL } from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';

export const examsApi = {
  getAssignedExams: async (baseToken) => {
    return axiosClient.get(API_ENDPOINTS.ASSIGNED_EXAMS, {
      headers: baseToken ? { Authorization: `Bearer ${baseToken}` } : {},
    });
  },

  getInstructions: async (scheduleId, baseToken) => {
    return axiosClient.get(API_ENDPOINTS.INSTRUCTIONS(scheduleId), {
      headers: baseToken ? { Authorization: `Bearer ${baseToken}` } : {},
    });
  },

  getSession: async (scheduleId, baseToken) => {
    return axiosClient.get(API_ENDPOINTS.SESSION(scheduleId), {
      headers: baseToken ? { Authorization: `Bearer ${baseToken}` } : {},
    });
  },

  startExam: async (scheduleId, baseToken) => {
    return axiosClient.post(API_ENDPOINTS.START_EXAM(scheduleId), {}, {
      headers: baseToken ? { Authorization: `Bearer ${baseToken}` } : {},
    });
  },

  getQuestions: async (scheduleId, elevatedToken) => {
    return axiosClient.get(API_ENDPOINTS.QUESTIONS(scheduleId), {
      headers: elevatedToken ? { Authorization: `Bearer ${elevatedToken}` } : {},
    });
  },

  saveAnswer: async (questionId, selectedOptionId, answerText, elevatedToken) => {
    return axiosClient.post(
      API_ENDPOINTS.SAVE_ANSWER,
      {
        question_id: questionId,
        selected_option_id: selectedOptionId || null,
        answer_text: answerText || null,
      },
      {
        headers: elevatedToken ? { Authorization: `Bearer ${elevatedToken}` } : {},
      }
    );
  },

  submitExam: async (scheduleId, elevatedToken, isAutoSubmitted = false) => {
    return axiosClient.post(
      API_ENDPOINTS.SUBMIT_EXAM(scheduleId),
      { is_auto_submitted: isAutoSubmitted },
      { headers: elevatedToken ? { Authorization: `Bearer ${elevatedToken}` } : {} }
    );
  },

  getExamReview: async (scheduleId, baseToken) => {
    return axiosClient.get(API_ENDPOINTS.REVIEW(scheduleId), {
      headers: baseToken ? { Authorization: `Bearer ${baseToken}` } : {},
    });
  },

  getExamResult: async (scheduleId, baseToken) => {
    return axiosClient.get(API_ENDPOINTS.RESULT(scheduleId), {
      headers: baseToken ? { Authorization: `Bearer ${baseToken}` } : {},
    });
  },

  pauseExam: (scheduleId, baseToken) => {
    return fetch(`${baseURL}${API_ENDPOINTS.PAUSE_EXAM(scheduleId)}`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${baseToken}`,
      },
    }).catch(() => {
      // Best-effort only
    });
  },
};
