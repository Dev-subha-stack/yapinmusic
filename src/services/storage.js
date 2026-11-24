// Local persistence adapter. Keep this API stable so it can later be replaced
// or combined with a database-backed profile/progress service.
export const storage = {
  get(key) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? null : JSON.parse(value);
    } catch (error) {
      console.warn(`Could not read local data for "${key}".`, error);
      return null;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Could not save local data for "${key}".`, error);
      return false;
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Could not remove local data for "${key}".`, error);
      return false;
    }
  }
};
