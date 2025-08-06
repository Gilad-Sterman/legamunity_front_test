import axios from 'axios';

// Using relative URL to avoid CORS/CSP issues in production
const API_URL = '/api';

const getAuthHeaders = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/**
 * Fetches all users from the backend.
 * @param {string} token - The JWT token for authorization.
 * @param {string} [search=''] - Optional search query.
 * @returns {Promise<Array>} - A promise that resolves to an array of users.
 */
export const fetchUsers = async (token, search = '') => {
  const response = await axios.get(`${API_URL}/admin/users`, {
    ...getAuthHeaders(token),
    params: { search },
  });
  return response.data.data;
};

/**
 * Toggles the disabled status of a user.
 * @param {string} token - The JWT token for authorization.
 * @param {string} uid - The UID of the user to update.
 * @param {boolean} disabled - The new disabled status.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
export const toggleUserStatus = async (token, uid, disabled) => {
  const response = await axios.put(
    `${API_URL}/admin/users/${uid}/toggle-status`,
    { disabled },
    getAuthHeaders(token)
  );
  return response.data;
};

/**
 * Deletes a user.
 * @param {string} token - The JWT token for authorization.
 * @param {string} uid - The UID of the user to delete.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
export const deleteUser = async (token, uid) => {
  const response = await axios.delete(`${API_URL}/admin/users/${uid}`, getAuthHeaders(token));
  return response.data;
};

/**
 * Updates a user's display name.
 * @param {string} token - The JWT token for authorization.
 * @param {string} uid - The UID of the user to update.
 * @param {string} displayName - The new display name.
 * @returns {Promise<Object>} - A promise that resolves to the response data.
 */
export const updateUserDisplayName = async (token, uid, displayName) => {
  const response = await axios.put(`${API_URL}/admin/users/${uid}/display-name`, { displayName }, getAuthHeaders(token));
  return response.data;
};
