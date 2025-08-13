import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  loginWithEmail, 
  logoutUser, 
  getCurrentUser,
  registerUser,
  resetPassword,
  updateUserRole,
  getAuthProvider,
  switchAuthProvider,
  testConnection,
  getAuthConfig
} from '../../services/hybridAuthService';

// Async thunk for registration
export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password, displayName }, { rejectWithValue }) => {
    try {
      const data = await registerUser(email, password, displayName);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for login
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await loginWithEmail(email, password);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logoutUser();
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to check authentication status on app load
export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getCurrentUser();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for password reset
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async ({ email }, { rejectWithValue }) => {
    try {
      const data = await resetPassword(email);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating user role (admin only)
export const updateRole = createAsyncThunk(
  'auth/updateRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const data = await updateUserRole(userId, role);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for switching auth provider
export const switchProvider = createAsyncThunk(
  'auth/switchProvider',
  async ({ provider }, { rejectWithValue }) => {
    try {
      const newProvider = switchAuthProvider(provider);
      return { provider: newProvider };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for testing connection
export const testAuthConnection = createAsyncThunk(
  'auth/testConnection',
  async (_, { rejectWithValue }) => {
    try {
      const data = await testConnection();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: !!localStorage.getItem('token'), // Set to true if token exists to trigger auth check
  error: null,
  authProvider: getAuthProvider(),
  authConfig: getAuthConfig(),
  connectionStatus: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateAuthProvider: (state) => {
      state.authProvider = getAuthProvider();
      state.authConfig = getAuthConfig();
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.authProvider = action.payload.authProvider || getAuthProvider();
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.authProvider = action.payload.authProvider || getAuthProvider();
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.authProvider = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // Even if logout fails, clear the state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.authProvider = null;
      })
      
      // Check Auth Status
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.authProvider = action.payload.authProvider || getAuthProvider();
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.authProvider = null;
      })
      
      // Password Reset
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Role
      .addCase(updateRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update user role if it's the current user
        if (state.user && action.payload.user && state.user.uid === action.payload.user.id) {
          state.user.role = action.payload.user.role;
        }
        state.error = null;
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Switch Provider
      .addCase(switchProvider.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(switchProvider.fulfilled, (state, action) => {
        state.isLoading = false;
        state.authProvider = action.payload.provider;
        state.authConfig = getAuthConfig();
        // Clear user state to force re-authentication
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(switchProvider.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Test Connection
      .addCase(testAuthConnection.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(testAuthConnection.fulfilled, (state, action) => {
        state.isLoading = false;
        state.connectionStatus = {
          success: true,
          message: action.payload.message,
          provider: action.payload.authProvider,
          timestamp: new Date().toISOString()
        };
        state.error = null;
      })
      .addCase(testAuthConnection.rejected, (state, action) => {
        state.isLoading = false;
        state.connectionStatus = {
          success: false,
          message: action.payload,
          timestamp: new Date().toISOString()
        };
        state.error = action.payload;
      });
  }
});

export const { clearError, updateAuthProvider } = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectError = (state) => state.auth.error;
export const selectAuthProvider = (state) => state.auth.authProvider;
export const selectAuthConfig = (state) => state.auth.authConfig;
export const selectConnectionStatus = (state) => state.auth.connectionStatus;

export default authSlice.reducer;
