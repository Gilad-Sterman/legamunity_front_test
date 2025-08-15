/**
 * Supabase Authentication Service
 * Communicates with the backend Supabase API for authentication operations
 * Maintains the same interface as the original authService.js for seamless migration
 */

// API base URL - using relative URL to avoid CORS/CSP issues in production
const API_URL = '/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // Handle token refresh scenarios
    if (data.needsRefresh) {
      const error = new Error(data.error || data.message || 'Token needs refresh');
      error.needsRefresh = true;
      throw error;
    }
    
    throw new Error(data.error || data.message || 'Something went wrong');
  }
  
  return data;
};

// Register a new user using Supabase
export const registerUser = async (email, password, displayName) => {
  try {
    const response = await fetch(`${API_URL}/supabase-auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        displayName,
        role: 'user' // Default role
      })
    });
    
    const data = await handleResponse(response);
    
    // Store token in localStorage for persistence
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('authProvider', 'supabase'); // Track auth provider
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Login with email and password using Supabase
export const loginWithEmail = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/supabase-auth/login`, {
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
      localStorage.setItem('authProvider', 'supabase'); // Track auth provider
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('authProvider');
    
    // Note: Supabase logout is handled client-side by removing the token
    // The backend doesn't maintain sessions, so no server call needed
    
    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    throw error;
  }
};

// Get current user using Supabase
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/supabase-auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await handleResponse(response);
    
    return data;
  } catch (error) {
    // Handle token refresh scenarios
    if (error.needsRefresh) {
      console.log('🔄 Token needs refresh, redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('authProvider');
      
      // Redirect to login page
      window.location.href = '/login';
      return;
    }
    
    // If token verification fails, clear it from storage
    localStorage.removeItem('token');
    localStorage.removeItem('authProvider');
    throw error;
  }
};

// Send password reset email using Supabase
export const resetPassword = async (email) => {
  try {
    const response = await fetch(`${API_URL}/supabase-auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw error;
  }
};

// Update user role (admin only) using Supabase
export const updateUserRole = async (userId, role, token) => {
  try {
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/supabase-auth/update-role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        role
      })
    });
    
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get user by ID using Supabase
export const getUserById = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(`${API_URL}/supabase-auth/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw error;
  }
};

// Test Supabase authentication connection
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/supabase-auth/test-connection`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw error;
  }
};

// Get authentication provider (for migration tracking)
export const getAuthProvider = () => {
  return localStorage.getItem('authProvider') || 'unknown';
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Get stored token
export const getToken = () => {
  return localStorage.getItem('token');
};
