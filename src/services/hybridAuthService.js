/**
 * Authentication Service
 * CLEANUP: Simplified to use Supabase only (Firebase dependencies removed)
 * Maintains the same interface as the original authService.js
 */

// CLEANUP: Firebase import commented out - using Supabase only
// import * as firebaseAuthService from './authService';
import * as supabaseAuthService from './supabaseAuthService';

// CLEANUP: Simplified configuration - Supabase only
const AUTH_CONFIG = {
  // Always use Supabase now
  defaultProvider: 'supabase',
  
  // CLEANUP: Fallback disabled - Supabase only
  allowFallback: false
};

// CLEANUP: Simplified - always returns 'supabase'
const getCurrentAuthProvider = () => {
  return 'supabase';
};

// CLEANUP: Simplified - no longer needed since we only use Supabase
const setAuthProvider = (provider) => {
  // CLEANUP: Still store for compatibility but always 'supabase'
  localStorage.setItem('authProvider', 'supabase');
};

// CLEANUP: Simplified - always returns Supabase service
const getAuthService = (provider = null) => {
  return {
    service: supabaseAuthService,
    provider: 'supabase'
  };
};

// Register a new user
export const registerUser = async (email, password, displayName) => {
  const { service, provider } = getAuthService();
  
  try {
    // CLEANUP: Removed console.log for debugging cleanup
    const result = await service.registerUser(email, password, displayName);
    
    // Ensure provider is tracked
    setAuthProvider(provider);
    
    return {
      ...result,
      authProvider: provider
    };
  } catch (error) {
    // CLEANUP: Removed Firebase fallback logic - Supabase only
    throw error;
  }
};

// Login with email and password
export const loginWithEmail = async (email, password) => {
  const { service, provider } = getAuthService();
  
  try {
    // CLEANUP: Removed console.log for debugging cleanup
    const result = await service.loginWithEmail(email, password);
    
    // Ensure provider is tracked
    setAuthProvider(provider);
    
    return {
      ...result,
      authProvider: provider
    };
  } catch (error) {
    // CLEANUP: Removed Firebase fallback logic - Supabase only
    throw error;
  }
};

// Logout user
export const logoutUser = async () => {
  const { service, provider } = getAuthService();
  
  try {
    // CLEANUP: Removed console.log for debugging cleanup
    const result = await service.logoutUser();
    
    // Clear provider tracking
    localStorage.removeItem('authProvider');
    
    return result;
  } catch (error) {
    // Even if logout fails, clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('authProvider');
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  const { service, provider } = getAuthService();
  
  try {
    const result = await service.getCurrentUser();
    return {
      ...result,
      authProvider: provider
    };
  } catch (error) {
    // CLEANUP: Removed Firebase fallback logic - Supabase only
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  const { service, provider } = getAuthService();
  
  try {
    // CLEANUP: Removed console.log for debugging cleanup
    return await service.resetPassword(email);
  } catch (error) {
    throw error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (userId, role, token) => {
  const { service, provider } = getAuthService();
  
  try {
    return await service.updateUserRole(userId, role, token);
  } catch (error) {
    throw error;
  }
};

// Additional hybrid-specific functions

// CLEANUP: Simplified - always returns 'supabase' since Firebase is disabled
export const switchAuthProvider = (newProvider) => {
  // CLEANUP: Only accept 'supabase' now
  if (newProvider !== 'supabase') {
    throw new Error('Invalid auth provider. Only "supabase" is supported.');
  }
  
  // CLEANUP: Removed console.log for debugging cleanup
  setAuthProvider(newProvider);
  
  // Clear existing token to force re-authentication
  localStorage.removeItem('token');
  
  return 'supabase';
};

// Get current auth provider
export const getAuthProvider = getCurrentAuthProvider;

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Get stored token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Test connection for current provider
export const testConnection = async () => {
  const { service, provider } = getAuthService();
  
  try {
    if (service.testConnection) {
      const result = await service.testConnection();
      return {
        ...result,
        authProvider: provider
      };
    } else {
      // CLEANUP: Simplified since we only use Supabase now
      return {
        success: true,
        message: `${provider} auth service is available`,
        authProvider: provider
      };
    }
  } catch (error) {
    throw error;
  }
};

// Get auth configuration
export const getAuthConfig = () => {
  return {
    currentProvider: getCurrentAuthProvider(),
    defaultProvider: AUTH_CONFIG.defaultProvider,
    allowFallback: AUTH_CONFIG.allowFallback,
    // CLEANUP: Only Supabase available now
    availableProviders: ['supabase']
  };
};
