import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const studentsApi = {
  /**
   * Retrieve students with server-side pagination, search and filters.
   * GET /api/v1/admin/students/?page=&page_size=&q=&class_id=&is_active=
   */
  list: async ({ page, pageSize, q, classId, isActive, signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.STUDENTS.LIST, {
      params: {
        page,
        page_size: pageSize,
        q: q || undefined,
        class_id: classId || undefined,
        is_active: isActive,
      },
      signal,
    });
    return unwrap(response);
  },

  /**
   * Retrieve a single student by ID.
   * GET /api/v1/admin/students/{student_id}
   */
  detail: async (id, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.STUDENTS.DETAIL(id), { signal });
    return unwrap(response);
  },

  /**
   * Create a new student.
   * POST /api/v1/admin/students/
   */
  create: async (data) => {
    const response = await axiosClient.post(API_ENDPOINTS.STUDENTS.LIST, data);
    return unwrap(response);
  },

  /**
   * Update an existing student.
   * PUT /api/v1/admin/students/{student_id}
   */
  update: async (id, data) => {
    const response = await axiosClient.put(API_ENDPOINTS.STUDENTS.DETAIL(id), data);
    return unwrap(response);
  },

  /**
   * Re-assign a student's class.
   * PUT /api/v1/admin/students/{student_id}
   */
  assignClass: async (id, classId) => {
    const response = await axiosClient.put(API_ENDPOINTS.STUDENTS.DETAIL(id), { class_id: classId });
    return unwrap(response);
  },

  /**
   * Update a student's candidate accessibility profile.
   * PUT /api/v1/admin/students/{student_id}
   */
  assignAccessibilityProfile: async (id, profile) => {
    const response = await axiosClient.put(API_ENDPOINTS.STUDENTS.DETAIL(id), { accessibility_profile: profile });
    return unwrap(response);
  },

  /**
   * Reset a student's password (by updating date of birth which regenerates the password hash).
   * PUT /api/v1/admin/students/{student_id}
   */
  resetPassword: async (id, dateOfBirth) => {
    const response = await axiosClient.put(API_ENDPOINTS.STUDENTS.DETAIL(id), { date_of_birth: dateOfBirth });
    return unwrap(response);
  },

  /**
   * Delete a student by ID.
   * DELETE /api/v1/admin/students/{student_id}
   */
  remove: async (id) => {
    const response = await axiosClient.delete(API_ENDPOINTS.STUDENTS.DETAIL(id));
    return unwrap(response);
  },

  /*
   * ARCHITECTURE EXTENSION POINT: Future Bulk CSV Import & Template Download
   *
   * The backend service contract is designed for future CSV imports at:
   *   - POST /api/v1/admin/students/import (multipart/form-data with roll_number, name, dob, class, profile)
   *   - GET /api/v1/admin/students/import-template (text/csv download)
   *
   * When implementing CSV import in future milestones, attach methods here:
   *   importCsv: async (formData) => unwrap(await axiosClient.post('/admin/students/import', formData)),
   *   downloadTemplate: async () => await axiosClient.get('/admin/students/import-template', { responseType: 'blob' }),
   */
};

export default studentsApi;
