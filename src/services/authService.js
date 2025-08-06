/**
 * Authentication Service
 * Communicates with the backend API for authentication operations
 */

// API base URL - should be configured based on environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Something went wrong');
  }
  
  return data;
};

// Register a new user
export const registerUser = async (email, password, displayName) => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        displayName
      })
    });
    
    const data = await handleResponse(response);
    
    // Store token in localStorage for persistence
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Login with email and password
export const loginWithEmail = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });
    
    const data = await handleResponse(response);
    
    // Store token in localStorage for persistence
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    // Remove token from localStorage
    localStorage.removeItem('token');
    return true;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await handleResponse(response);
    
    return {
      user: data.user,
      token
    };
  } catch (error) {
    // If token is invalid, remove it
    localStorage.removeItem('token');
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (uid, role, token) => {
  try {
    const response = await fetch(`${API_URL}/auth/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uid, role })
    });
    
    return await handleResponse(response);
  } catch (error) {
    throw error;
  }
};
