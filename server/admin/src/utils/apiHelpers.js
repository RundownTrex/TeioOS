/**
 * API response helpers.
 *
 * The backend wraps every response (except login) in:
 *   APIResponse { success, message, data, errors, timestamp }
 *
 * The axios client interceptor already returns the envelope body, so these
 * helpers extract the payload and normalize validation errors.
 */

export const unwrap = (response) => {
  if (response && typeof response === 'object' && 'success' in response) {
    return response.data ?? null;
  }
  return response ?? null;
};

export const getMessage = (response, fallback = '') => {
  if (response && typeof response === 'object' && 'success' in response) {
    return response.message || fallback;
  }
  return fallback;
};

/**
 * Backend 422 validation errors arrive flattened as ["field: message", ...].
 * Maps them to { fieldName: message } for field-level form display.
 */
export const extractFieldErrors = (details) => {
  const fieldErrors = {};
  if (Array.isArray(details)) {
    details.forEach((detail) => {
      if (typeof detail !== 'string') return;
      const separatorIndex = detail.indexOf(':');
      if (separatorIndex > 0) {
        const field = detail.slice(0, separatorIndex).trim();
        const message = detail.slice(separatorIndex + 1).trim();
        if (field && message) fieldErrors[field] = message;
      }
    });
  }
  return fieldErrors;
};
