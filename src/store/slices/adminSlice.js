import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchUsers, toggleUserStatus, deleteUser, updateUserDisplayName } from '../../services/adminService';

// Async thunk to fetch users
export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (searchQuery = '', { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      const users = await fetchUsers(token, searchQuery);
      return users;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to toggle user status
export const toggleAdminUserStatus = createAsyncThunk(
  'admin/toggleUserStatus',
  async ({ uid, disabled }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      await toggleUserStatus(token, uid, disabled);
      return { uid, disabled };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to update user display name
export const updateAdminUserDisplayName = createAsyncThunk(
  'admin/updateUserDisplayName',
  async ({ uid, displayName }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      await updateUserDisplayName(token, uid, displayName);
      return { uid, displayName };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to delete a user
export const deleteAdminUser = createAsyncThunk(
  'admin/deleteUser',
  async (uid, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      await deleteUser(token, uid);
      return uid;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  users: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users cases
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Toggle user status cases
      .addCase(toggleAdminUserStatus.fulfilled, (state, action) => {
        const index = state.users.findIndex(user => user.uid === action.payload.uid);
        if (index !== -1) {
          state.users[index].disabled = action.payload.disabled;
        }
      })
      .addCase(toggleAdminUserStatus.rejected, (state, action) => {
        state.error = action.payload; // Show error but don't stop loading
      })
      // Update display name cases
      .addCase(updateAdminUserDisplayName.fulfilled, (state, action) => {
        const { uid, displayName } = action.payload;
        const userIndex = state.users.findIndex(user => user.uid === uid);
        if (userIndex !== -1) {
          state.users[userIndex].displayName = displayName;
        }
      })
      .addCase(updateAdminUserDisplayName.rejected, (state, action) => {
        state.error = action.payload; // Show error
      })
      // Delete user cases
      .addCase(deleteAdminUser.fulfilled, (state, action) => {
        state.users = state.users.filter(user => user.uid !== action.payload);
      })
      .addCase(deleteAdminUser.rejected, (state, action) => {
        state.error = action.payload; // Show error
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
