// LocalStorage Manager Utility
// Provides safe and validated access to browser LocalStorage

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_PHONE: 'auth_phone',
  USER_PROFILE: 'user_profile',
  COMMUNITY_POSTS: 'community_posts',
  USER_CROPS: 'user_crops',
  USER_ALERTS: 'user_alerts',
  USER_SETTINGS: 'user_settings',
  APP_THEME: 'app_theme',
  APP_LANGUAGE: 'app_language',
  DATA_VERSION: 'data_version',
};

// Check if LocalStorage is available
const isLocalStorageAvailable = () => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Get item from LocalStorage with error handling
export const getItem = (key, defaultValue = null) => {
  if (!isLocalStorageAvailable()) {
    console.error('LocalStorage is not available');
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    
    // Try to parse JSON, return raw string if parsing fails
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.error(`Error reading from LocalStorage (${key}):`, error);
    return defaultValue;
  }
};

// Set item in LocalStorage with error handling
export const setItem = (key, value) => {
  if (!isLocalStorageAvailable()) {
    console.error('LocalStorage is not available');
    return false;
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded. Please clear some data.');
      // Optionally trigger a user notification here
    } else {
      console.error(`Error writing to LocalStorage (${key}):`, error);
    }
    return false;
  }
};

// Remove item from LocalStorage
export const removeItem = (key) => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from LocalStorage (${key}):`, error);
    return false;
  }
};

// Clear all LocalStorage data
export const clearAll = () => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing LocalStorage:', error);
    return false;
  }
};

// Get storage usage information
export const getStorageInfo = () => {
  if (!isLocalStorageAvailable()) {
    return { available: false };
  }

  try {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    return {
      available: true,
      usedBytes: totalSize,
      usedKB: (totalSize / 1024).toFixed(2),
      usedMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { available: true, error: true };
  }
};

// Validate data before storing
export const validateAndSet = (key, value, validator) => {
  if (validator && typeof validator === 'function') {
    if (!validator(value)) {
      console.error(`Validation failed for key: ${key}`);
      return false;
    }
  }
  return setItem(key, value);
};

export { STORAGE_KEYS };
export default {
  getItem,
  setItem,
  removeItem,
  clearAll,
  getStorageInfo,
  validateAndSet,
  isAvailable: isLocalStorageAvailable,
  KEYS: STORAGE_KEYS,
};
