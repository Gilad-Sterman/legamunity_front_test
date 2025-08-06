import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for scheduling an interview
export const scheduleInterview = createAsyncThunk(
  'scheduling/scheduleInterview',
  async (scheduleData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      let url, body;
      
      if (scheduleData.sessionType === 'existing') {
        // Add interview to existing session
        url = `/api/admin/sessions/${scheduleData.sessionId}/interviews`;
        body = JSON.stringify(scheduleData.interview);
      } else {
        // Create new session
        url = '/api/admin/sessions';
        body = JSON.stringify(scheduleData);
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data);
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching available users
export const fetchUsers = createAsyncThunk(
  'scheduling/fetchUsers',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Temporarily disable auth for testing
      // const { auth } = getState();
      
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Temporarily remove auth for testing
          // 'x-auth-token': auth.token,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data);
      }
      
      return data.data || data; // Handle both formats
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching existing sessions
export const fetchSessions = createAsyncThunk(
  'scheduling/fetchSessions',
  async (_, { rejectWithValue, getState }) => {
    try {
      // Temporarily disable auth for testing
      const { auth } = getState();
      
      const response = await fetch('/api/admin/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data);
      }
      
      // Extract users array from API response structure { success: true, data: [...] }
      return data.data || data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  users: [],
  sessions: [],
  scheduledSessions: [],
  currentSchedule: {
    sessionId: '', // New field for session selection
    sessionType: 'existing', // 'existing' or 'new'
    userId: '',
    date: '',
    time: '',
    duration: 60,
    interviewType: 'standard',
    notes: '',
    location: 'online',
    friendInterview: false
  },
  loading: false,
  sessionsLoading: false,
  error: null,
  success: false
};

const schedulingSlice = createSlice({
  name: 'scheduling',
  initialState,
  reducers: {
    updateScheduleField: (state, action) => {
      const { field, value } = action.payload;
      state.currentSchedule[field] = value;
    },
    resetScheduleForm: (state) => {
      state.currentSchedule = initialState.currentSchedule;
      state.error = null;
      state.success = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    addScheduledSession: (state, action) => {
      state.scheduledSessions.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      // Schedule interview
      .addCase(scheduleInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(scheduleInterview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.scheduledSessions.push(action.payload);
        // Reset form after successful scheduling
        state.currentSchedule = initialState.currentSchedule;
      })
      .addCase(scheduleInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Failed to schedule interview';
      })
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = Array.isArray(action.payload) ? action.payload : action.payload.data || [];
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || action.payload || 'Failed to fetch users';
      })
      // Fetch sessions
      .addCase(fetchSessions.pending, (state) => {
        state.sessionsLoading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false;
        state.sessions = Array.isArray(action.payload) ? action.payload : action.payload.data || [];
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.sessionsLoading = false;
        state.error = action.payload?.message || action.payload || 'Failed to fetch sessions';
      });
  },
});

export const { 
  updateScheduleField, 
  resetScheduleForm, 
  clearError, 
  clearSuccess, 
  addScheduledSession 
} = schedulingSlice.actions;

export default schedulingSlice.reducer;
