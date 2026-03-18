// Key used in localStorage
const TOKEN_KEY = "agritrust_jwt";

/**
 * Save JWT token
 * @param {string} token
 */
export const saveToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Get JWT token
 * @returns {string | null}
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove JWT token
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Optional: Check if token exists
 * @returns {boolean}
 */
export const isAuthenticated = () => !!getToken();
