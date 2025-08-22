import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import interviewService from '../../services/interviewService';

// Async thunks for interview operations
export const fetchSessionInterviews = createAsyncThunk(
  'interviews/fetchSessionInterviews',
  async (sessionId, { rejectWithValue }) => {
    try {
      const response = await interviewService.getSessionInterviews(sessionId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return { sessionId, interviews: response.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInterview = createAsyncThunk(
  'interviews/fetchInterview',
  async (interviewId, { rejectWithValue }) => {
    try {
      const response = await interviewService.getInterview(interviewId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createInterview = createAsyncThunk(
  'interviews/createInterview',
  async ({ sessionId, interviewData }, { rejectWithValue }) => {
    try {
      const response = await interviewService.createInterview(sessionId, interviewData);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return { sessionId, interview: response.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateInterview = createAsyncThunk(
  'interviews/updateInterview',
  async ({ interviewId, updateData }, { rejectWithValue }) => {
    try {
      const response = await interviewService.updateInterview(interviewId, updateData);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteInterview = createAsyncThunk(
  'interviews/deleteInterview',
  async (interviewId, { rejectWithValue }) => {
    try {
      const response = await interviewService.deleteInterview(interviewId);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return interviewId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNormalizedInterview = createAsyncThunk(
  'interviews/deleteNormalizedInterview',
  async ({ interviewId }, { rejectWithValue }) => {
    try {
      const result = await interviewService.deleteInterview(interviewId);
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to delete interview');
      }
      return { interviewId };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete interview');
    }
  }
);

// Async thunk for uploading interview file - goes to interviews/:id/upload, but from the sessionsSupabase file in the backend routes folder 
export const uploadInterviewFile = createAsyncThunk(
  'interviews/:id/upload',
  async ({ interviewId, file, sessionData }, { rejectWithValue }) => {
    try {
      const result = await interviewService.uploadInterviewFile(interviewId, file, sessionData);
      if (!result.success) {
        return rejectWithValue(result.error || 'Failed to upload file');
      }
      // Extract interview from the nested response structure
      const interview = result.data.interview || result.data;
      return { interviewId, interview };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to upload file');
    }
  }
);

export const fetchInterviews = createAsyncThunk(
  'interviews/fetchInterviews',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await interviewService.getInterviews(params);
      if (!response.success) {
        return rejectWithValue(response.error);
      }
      return {
        interviews: response.data,
        pagination: response.pagination
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Interviews organized by session ID for efficient lookup
  interviewsBySession: {},
  // Individual interviews by ID
  interviewsById: {},
  // Global interviews list for pagination
  interviews: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  },
  filters: {
    search: '',
    status: 'all',
    type: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  },
  loading: false,
  sessionLoading: {},
  uploadLoading: false,
  updateLoading: false,
  deleteLoading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false
};

const interviewsSlice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        status: 'all',
        type: 'all',
        sortBy: 'created_at',
        sortOrder: 'desc'
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSessionInterviews: (state, action) => {
      const sessionId = action.payload;
      delete state.interviewsBySession[sessionId];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch session interviews
      .addCase(fetchSessionInterviews.pending, (state, action) => {
        const sessionId = action.meta.arg;
        state.sessionLoading[sessionId] = true;
        state.error = null;
      })
      .addCase(fetchSessionInterviews.fulfilled, (state, action) => {
        const { sessionId, interviews } = action.payload;
        state.sessionLoading[sessionId] = false;
        
        // Ensure interviews is an array
        const interviewsArray = Array.isArray(interviews) ? interviews : [];
        state.interviewsBySession[sessionId] = interviewsArray;
        
        // Also update interviewsById for individual access
        interviewsArray.forEach(interview => {
          state.interviewsById[interview.id] = interview;
        });
      })
      .addCase(fetchSessionInterviews.rejected, (state, action) => {
        const sessionId = action.meta.arg;
        state.sessionLoading[sessionId] = false;
        state.error = action.payload;
      })

      // Fetch single interview
      .addCase(fetchInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterview.fulfilled, (state, action) => {
        state.loading = false;
        const interview = action.payload;
        state.interviewsById[interview.id] = interview;
        
        // Update session interviews if they exist
        if (state.interviewsBySession[interview.session_id]) {
          const sessionInterviews = state.interviewsBySession[interview.session_id];
          const index = sessionInterviews.findIndex(i => i.id === interview.id);
          if (index !== -1) {
            sessionInterviews[index] = interview;
          } else {
            sessionInterviews.push(interview);
          }
        }
      })
      .addCase(fetchInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create interview
      .addCase(createInterview.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createInterview.fulfilled, (state, action) => {
        state.createLoading = false;
        const { sessionId, interview } = action.payload;
        
        // Add to interviewsById
        state.interviewsById[interview.id] = interview;
        
        // Add to session interviews
        if (!state.interviewsBySession[sessionId]) {
          state.interviewsBySession[sessionId] = [];
        }
        state.interviewsBySession[sessionId].push(interview);
      })
      .addCase(createInterview.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })

      // Update interview
      .addCase(updateInterview.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateInterview.fulfilled, (state, action) => {
        state.updateLoading = false;
        const interview = action.payload;
        
        // Update interviewsById
        state.interviewsById[interview.id] = interview;
        
        // Update session interviews
        if (state.interviewsBySession[interview.session_id]) {
          const sessionInterviews = state.interviewsBySession[interview.session_id];
          const index = sessionInterviews.findIndex(i => i.id === interview.id);
          if (index !== -1) {
            sessionInterviews[index] = interview;
          }
        }
        
        // Update global interviews list
        const globalIndex = state.interviews.findIndex(i => i.id === interview.id);
        if (globalIndex !== -1) {
          state.interviews[globalIndex] = interview;
        }
      })
      .addCase(updateInterview.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })

      // Delete interview
      .addCase(deleteInterview.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteInterview.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const interviewId = action.payload;
        const interview = state.interviewsById[interviewId];
        
        if (interview) {
          // Remove from interviewsById
          delete state.interviewsById[interviewId];
          
          // Remove from session interviews
          if (state.interviewsBySession[interview.session_id]) {
            state.interviewsBySession[interview.session_id] = 
              state.interviewsBySession[interview.session_id].filter(i => i.id !== interviewId);
          }
          
          // Remove from global interviews list
          state.interviews = state.interviews.filter(i => i.id !== interviewId);
        }
      })
      .addCase(deleteInterview.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      })

      // Upload interview file
      .addCase(uploadInterviewFile.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadInterviewFile.fulfilled, (state, action) => {
        state.uploadLoading = false;
        const { interviewId, interview } = action.payload;
        
        // Update interview in interviewsById
        state.interviewsById[interviewId] = interview;
        
        // Update interview in session interviews
        if (interview.session_id && state.interviewsBySession[interview.session_id]) {
          const sessionInterviews = state.interviewsBySession[interview.session_id];
          const index = sessionInterviews.findIndex(i => i.id === interviewId);
          if (index !== -1) {
            sessionInterviews[index] = interview;
          }
        }
        
        // Update global interviews list
        const globalIndex = state.interviews.findIndex(i => i.id === interviewId);
        if (globalIndex !== -1) {
          state.interviews[globalIndex] = interview;
        }
      })
      .addCase(uploadInterviewFile.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload;
      })

      // Fetch interviews with pagination
      .addCase(fetchInterviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterviews.fulfilled, (state, action) => {
        state.loading = false;
        const { interviews, pagination } = action.payload;
        state.interviews = interviews;
        state.pagination = pagination;
        
        // Update interviewsById
        interviews.forEach(interview => {
          state.interviewsById[interview.id] = interview;
        });
      })
      .addCase(fetchInterviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setFilters,
  clearFilters,
  setPagination,
  clearError,
  clearSessionInterviews
} = interviewsSlice.actions;

export default interviewsSlice.reducer;
