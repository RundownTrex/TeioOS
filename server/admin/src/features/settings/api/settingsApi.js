import axiosClient from '../../../api/axiosClient';
import { API_ENDPOINTS } from '../../../api/endpoints';
import { unwrap } from '../../../utils/apiHelpers';

/**
 * Settings API client module.
 * All settings operations go through this module.
 * Settings are stored as key-value pairs and returned grouped by category.
 */
export const settingsApi = {
  /**
   * Fetch all system settings grouped by category.
   * GET /api/v1/admin/settings/
   * Returns: { categories: { institution: [...], security: [...], ... } }
   */
  getGrouped: async ({ signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.SETTINGS.LIST, { signal });
    return unwrap(response);
  },

  /**
   * Fetch settings for a single category.
   * GET /api/v1/admin/settings/:category
   */
  getByCategory: async (category, { signal } = {}) => {
    const response = await axiosClient.get(API_ENDPOINTS.SETTINGS.CATEGORY(category), { signal });
    return unwrap(response);
  },

  /**
   * Bulk-update multiple settings in a single request.
   * PATCH /api/v1/admin/settings/
   * Body: { settings: { "institution.name": "My College", ... } }
   */
  bulkUpdate: async (settings) => {
    const response = await axiosClient.patch(API_ENDPOINTS.SETTINGS.BULK_UPDATE, { settings });
    return unwrap(response);
  },

  /**
   * Update a single setting by its namespaced key.
   * PATCH /api/v1/admin/settings/:key
   * Body: { value: "..." }
   */
  updateOne: async (key, value) => {
    const response = await axiosClient.patch(API_ENDPOINTS.SETTINGS.UPDATE(key), { value });
    return unwrap(response);
  },
};

export default settingsApi;
