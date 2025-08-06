import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching sessions with filtering and pagination
export const fetchSessions = createAsyncThunk(
  'sessions/fetchSessions',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      // Build query parameters for life story sessions
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status); // Changed from 'stage' to 'status'
      if (params.priority_level && params.priority_level !== 'all') queryParams.append('priority_level', params.priority_level); // Added priority_level filter
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const queryString = queryParams.toString();
      const url = `/api/admin/sessions${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch sessions');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching a single session by ID
export const fetchSessionById = createAsyncThunk(
  'sessions/fetchSessionById',
  async (sessionId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch session');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for creating a session
export const createSession = createAsyncThunk(
  'sessions/createSession',
  async (sessionData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const response = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(sessionData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to create session');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating a session
export const updateSession = createAsyncThunk(
  'sessions/updateSession',
  async ({ sessionId, updateData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update session');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting a session
export const deleteSession = createAsyncThunk(
  'sessions/deleteSession',
  async (sessionId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to delete session');
      }

      return sessionId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating interview
export const updateInterview = createAsyncThunk(
  'sessions/updateInterview',
  async ({ interviewId, updateData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update interview');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating session scheduling
export const updateSessionScheduling = createAsyncThunk(
  'sessions/updateSessionScheduling',
  async ({ sessionId, schedulingData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const response = await fetch(`/api/admin/sessions/${sessionId}/scheduling`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ interview_scheduling: schedulingData }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update scheduling');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for adding interview to session
export const addInterviewToSession = createAsyncThunk(
  'sessions/addInterviewToSession',
  async ({ sessionId, interviewData }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const response = await fetch(`/api/admin/sessions/${sessionId}/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(interviewData),
      });
      const responseData = await response.json();



      if (!response.ok) {
        return rejectWithValue(responseData.message || 'Failed to add interview');
      }

      // Backend actually returns the interview object directly in data
      // Check if data contains session and interview properties, or just the interview
      if (responseData.data.session && responseData.data.interview) {
        // Expected structure: { data: { session, interview } }
        return { sessionId, interview: responseData.data.interview, session: responseData.data.session };
      } else {
        // Actual structure: { data: interviewObject }
        return { sessionId, interview: responseData.data, session: null };
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for uploading interview file
export const uploadInterviewFile = createAsyncThunk(
  'sessions/uploadInterviewFile',
  async ({ interviewId, file }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/interviews/${interviewId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to upload file');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  sessions: [],
  currentSession: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalSessions: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  },
  filters: {
    search: '',
    status: 'all', // Changed from 'stage' to 'status'
    priority_level: 'all', // Added priority_level filter
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  loading: false,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  uploadLoading: false,
  error: null
};

// Sessions slice
const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        status: 'all', // Changed from 'stage' to 'status'
        priority_level: 'all', // Added priority_level filter
        search: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions cases
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch session by ID cases
      .addCase(fetchSessionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
      })
      .addCase(fetchSessionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create session cases
      .addCase(createSession.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.createLoading = false;
        state.sessions.unshift(action.payload);
        state.currentSession = action.payload;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })
      // Update session cases
      .addCase(updateSession.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.sessions.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.currentSession && state.currentSession.id === action.payload.id) {
          state.currentSession = action.payload;
        }
      })
      .addCase(updateSession.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      // Delete session cases
      .addCase(deleteSession.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.sessions = state.sessions.filter(s => s.id !== action.payload);
        if (state.currentSession && state.currentSession.id === action.payload) {
          state.currentSession = null;
        }
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })
      // Update interview cases
      .addCase(updateInterview.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateInterview.fulfilled, (state, action) => {
        state.updateLoading = false;
        // Update interview in sessions array
        state.sessions.forEach(session => {
          const interviewIndex = session.interviews.findIndex(i => i.id === action.payload.id);
          if (interviewIndex !== -1) {
            session.interviews[interviewIndex] = { ...session.interviews[interviewIndex], ...action.payload };
          }
        });
        // Update interview in current session if it exists
        if (state.currentSession) {
          const interviewIndex = state.currentSession.interviews.findIndex(i => i.id === action.payload.id);
          if (interviewIndex !== -1) {
            state.currentSession.interviews[interviewIndex] = { ...state.currentSession.interviews[interviewIndex], ...action.payload };
          }
        }
      })
      .addCase(updateInterview.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      // Update session scheduling cases
      .addCase(updateSessionScheduling.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateSessionScheduling.fulfilled, (state, action) => {
        state.updateLoading = false;
        const sessionIndex = state.sessions.findIndex(s => s.id === action.payload.id);
        if (sessionIndex !== -1) {
          state.sessions[sessionIndex] = action.payload;
        }
        if (state.currentSession && state.currentSession.id === action.payload.id) {
          state.currentSession = action.payload;
        }
      })
      .addCase(updateSessionScheduling.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })
      // Add interview to session cases
      .addCase(addInterviewToSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addInterviewToSession.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { sessionId, interview, session }
        const { sessionId, interview, session } = action.payload;
        

        
        // Find and update the session by adding the interview manually
        const sessionIndex = state.sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1 && interview) {
          // Add the interview to the existing session's interviews array
          const currentSession = state.sessions[sessionIndex];
          state.sessions[sessionIndex] = {
            ...currentSession,
            interviews: [...(currentSession.interviews || []), interview],
            updatedAt: new Date().toISOString()
          };
        }
        
        // Update current session if it matches
        if (state.currentSession && state.currentSession.id === sessionId && interview) {
          state.currentSession = {
            ...state.currentSession,
            interviews: [...(state.currentSession.interviews || []), interview],
            updatedAt: new Date().toISOString()
          };
        }
      })
      .addCase(addInterviewToSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload interview file cases
      .addCase(uploadInterviewFile.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadInterviewFile.fulfilled, (state, action) => {
        state.uploadLoading = false;
        const { interview } = action.payload;
        
        // Update interview in sessions
        for (const session of state.sessions) {
          const interviewIndex = session.interviews?.findIndex(i => i.id === interview.id);
          if (interviewIndex !== -1) {
            session.interviews[interviewIndex] = interview;
            session.updatedAt = new Date().toISOString();
            break;
          }
        }
        
        // Update current session if it matches
        if (state.currentSession?.interviews) {
          const interviewIndex = state.currentSession.interviews.findIndex(i => i.id === interview.id);
          if (interviewIndex !== -1) {
            state.currentSession.interviews[interviewIndex] = interview;
            state.currentSession.updatedAt = new Date().toISOString();
          }
        }
      })
      .addCase(uploadInterviewFile.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentSession, setFilters, clearFilters, setPagination } = sessionsSlice.actions;

export default sessionsSlice.reducer;
