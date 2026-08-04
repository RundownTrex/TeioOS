import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

/**
 * API client for managing exam schedule student assignments.
 * Supports individual student assignment, class assignment, department assignment,
 * time overrides, and assignment removal.
 */
export const studentAssignmentsApi = {
  /**
   * Retrieve assigned students for a schedule with server-side pagination, search, and filters.
   * GET /api/v1/admin/exam-schedules/{schedule_id}/students/?page=&page_size=&q=&class_id=&status=
   */
  list: async ({ scheduleId, page, pageSize, q, classId, status, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.STUDENT_ASSIGNMENTS.LIST(scheduleId), {
      params: {
        page,
        page_size: pageSize,
        q: q || undefined,
        class_id: classId || undefined,
        status: status || undefined,
      },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Assign an individual student to an exam schedule.
   * POST /api/v1/admin/exam-schedules/{schedule_id}/students/
   */
  assignStudent: async (scheduleId, data) => {
    const response = await axiosClient.post(
      API_ENDPOINTS.STUDENT_ASSIGNMENTS.ASSIGN_STUDENT(scheduleId),
      data
    );
    return unwrap(response);
  },

  /**
   * Assign all active students in a class to an exam schedule.
   * POST /api/v1/admin/exam-schedules/{schedule_id}/students/classes
   */
  assignClass: async (scheduleId, data) => {
    const response = await axiosClient.post(
      API_ENDPOINTS.STUDENT_ASSIGNMENTS.ASSIGN_CLASS(scheduleId),
      data
    );
    return unwrap(response);
  },

  /**
   * Assign all active students in a department to an exam schedule.
   * POST /api/v1/admin/exam-schedules/{schedule_id}/students/departments
   */
  assignDepartment: async (scheduleId, data) => {
    const response = await axiosClient.post(
      API_ENDPOINTS.STUDENT_ASSIGNMENTS.ASSIGN_DEPARTMENT(scheduleId),
      data
    );
    return unwrap(response);
  },

  /**
   * Update an assignment (e.g. per-student individual_duration_minutes override).
   * PUT /api/v1/admin/exam-schedules/{schedule_id}/students/{student_id}
   */
  updateAssignment: async (scheduleId, studentId, data) => {
    const response = await axiosClient.put(
      API_ENDPOINTS.STUDENT_ASSIGNMENTS.DETAIL(scheduleId, studentId),
      data
    );
    return unwrap(response);
  },

  /**
   * Remove a student assignment from an exam schedule.
   * DELETE /api/v1/admin/exam-schedules/{schedule_id}/students/{student_id}
   */
  removeAssignment: async (scheduleId, studentId) => {
    const response = await axiosClient.delete(
      API_ENDPOINTS.STUDENT_ASSIGNMENTS.DETAIL(scheduleId, studentId)
    );
    return unwrap(response);
  },

  /**
   * Architecture Extension Point: Future Bulk CSV Assignment
   *
   * Planned Signature:
   * importCSV: async (scheduleId, file, { onProgress } = {}) => {
   *   const formData = new FormData();
   *   formData.append('file', file);
   *   const response = await axiosClient.post(
   *     `/admin/exam-schedules/${scheduleId}/students/import-csv`,
   *     formData,
   *     { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress: onProgress }
   *   );
   *   return unwrap(response);
   * }
   */
  importCSV: async () => {
    throw new Error('Bulk CSV assignment is prepared in architecture and will be enabled in a future update.');
  },
};

export default studentAssignmentsApi;
