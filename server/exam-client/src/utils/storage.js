/**
 * Safe wrapper for SessionStorage and LocalStorage operations.
 */

export const getItem = (key, storage = sessionStorage) => {
  try {
    const item = storage.getItem(key);
    if (!item) return null;
    return JSON.parse(item);
  } catch (error) {
    try {
      return storage.getItem(key);
    } catch (e) {
      console.error(`Error reading ${key} from storage:`, e);
      return null;
    }
  }
};

export const setItem = (key, value, storage = sessionStorage) => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    storage.setItem(key, serialized);
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
};

export const removeItem = (key, storage = sessionStorage) => {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
};
