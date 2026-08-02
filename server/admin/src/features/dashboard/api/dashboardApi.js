import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

export const dashboardApi = {
  /**
   * Retrieve aggregated statistics for the administration dashboard.
   * GET /api/v1/admin/dashboard/
   */
  getStats: async ({ signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.DASHBOARD.STATS, { signal });
    return unwrap(response);
  },
};

export default dashboardApi;
