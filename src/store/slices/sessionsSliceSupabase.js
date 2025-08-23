import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import supabaseSessionsService from '../../services/supabaseSessionsService';

/**
 * Supabase Sessions Redux Slice
 * Manages sessions state using Supabase backend API
 */

// Async thunk for fetching sessions with filtering and pagination
export const fetchSessions = createAsyncThunk(
  'sessionsSupabase/fetchSessions',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      // Get token from auth state
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        return rejectWithValue('No authentication token available');
      }

      // Pass token to service method
      const result = await supabaseSessionsService.getSessions(params, token);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return {
        sessions: result.data,
        pagination: result.pagination,
        message: result.message
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching a single session by ID
export const fetchSessionById = createAsyncThunk(
  'sessionsSupabase/fetchSessionById',
  async (sessionId, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.getSessionById(sessionId);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for creating a new session
export const createSession = createAsyncThunk(
  'sessionsSupabase/createSession',
  async (sessionData, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.createSession(sessionData);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating a session
export const updateSession = createAsyncThunk(
  'sessionsSupabase/updateSession',
  async ({ sessionId, updateData }, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.updateSession(sessionId, updateData);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating session scheduling
export const updateSessionScheduling = createAsyncThunk(
  'sessionsSupabase/updateSessionScheduling',
  async ({ sessionId, schedulingData }, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.updateSessionScheduling(sessionId, schedulingData);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for adding an interview to a session
export const addInterviewToSession = createAsyncThunk(
  'sessionsSupabase/addInterviewToSession',
  async ({ sessionId, interviewData }, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.addInterviewToSession(sessionId, interviewData);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return { sessionId, interview: result.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting a session
export const deleteSession = createAsyncThunk(
  'sessionsSupabase/deleteSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.deleteSession(sessionId);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return { sessionId, message: result.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting an interview from a session
export const deleteInterview = createAsyncThunk(
  'sessionsSupabase/deleteInterview',
  async ({ sessionId, interviewId }, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.deleteInterview(interviewId, sessionId);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return { interviewId, message: result.message };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching session statistics
export const fetchSessionStats = createAsyncThunk(
  'sessionsSupabase/fetchSessionStats',
  async (_, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.getSessionStats();

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating an interview
export const updateInterview = createAsyncThunk(
  'sessionsSupabase/updateInterview',
  async ({ interviewId, updateData }, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.updateInterview(interviewId, updateData);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return { interviewId, interview: result.data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching session statistics for dashboard
// export const fetchSessionStats = createAsyncThunk(
//   'sessionsSupabase/fetchSessionStats',
//   async (_, { rejectWithValue }) => {
//     try {
//       const result = await supabaseSessionsService.getSessionStats();

//       if (!result.success) {
//         return rejectWithValue(result.error);
//       }

//       return result.data;
//     } catch (error) {
//       return rejectWithValue(error.message);
//     }
//   }
// );

// Async thunk for uploading interview file with AI processing (synchronous)
export const uploadInterviewFile = createAsyncThunk(
  'sessionsSupabase/uploadInterviewFile',
  async ({ interviewId, file }, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.uploadInterviewFile(interviewId, file);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return {
        interviewId,
        interview: result.data.interview,
        fileMetadata: result.data.fileMetadata,
        transcription: result.data.transcription,
        draft: result.data.draft,
        processingComplete: result.data.processingComplete,
        message: result.message
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for uploading interview file with async AI processing
export const uploadInterviewFileAsync = createAsyncThunk(
  'sessionsSupabase/uploadInterviewFileAsync',
  async ({ interviewId, file, sessionData }, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.uploadInterviewFileAsync(interviewId, file, sessionData);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return {
        interviewId,
        interview: result.data.interview,
        fileMetadata: result.data.fileMetadata,
        message: result.message
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for regenerating draft with notes and instructions
export const regenerateDraft = createAsyncThunk(
  'sessionsSupabase/regenerateDraft',
  async ({ sessionId, draftId, instructions, notes }, { rejectWithValue }) => {
    try {
      const result = await supabaseSessionsService.regenerateDraft(sessionId, draftId, instructions, notes);

      if (!result.success) {
        return rejectWithValue(result.error);
      }

      return {
        sessionId,
        draftId,
        newDraft: result.data.draft,
        previousDraftId: result.data.previousDraftId,
        regenerationType: result.data.regenerationType,
        version: result.data.version,
        message: result.message
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  sessions: [],
  currentSession: null,
  stats: null,
  loading: false,
  uploadLoading: false,
  error: null,
  filters: {
    status: 'all',
    priority_level: 'all',
    session_type: 'all',
    preferred_language: 'all',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    currentPage: 1
  }
};

// Create the slice
const sessionsSliceSupabase = createSlice({
  name: 'sessionsSupabase',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Set current session
    setCurrentSession: (state, action) => {
      state.currentSession = action.payload;
    },

    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Clear filters
    clearFilters: (state) => {
      state.filters = {
        status: 'all',
        priority_level: 'all',
        session_type: 'all',
        preferred_language: 'all',
        search: '',
        sort_by: 'created_at',
        sort_order: 'desc'
      };
    },

    // Set pagination
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch sessions
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload.sessions;
        state.pagination = action.payload.pagination || state.pagination;
        state.error = null;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch session by ID
      .addCase(fetchSessionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.error = null;
      })
      .addCase(fetchSessionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create session
      .addCase(createSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions.unshift(action.payload); // Add to beginning of array
        state.error = null;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update session
      .addCase(updateSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sessions.findIndex(session => session.id === action.payload.id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.currentSession && state.currentSession.id === action.payload.id) {
          state.currentSession = action.payload;
        }
        state.error = null;
      })
      .addCase(updateSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update session scheduling
      .addCase(updateSessionScheduling.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSessionScheduling.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sessions.findIndex(session => session.id === action.payload.id);
        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
        if (state.currentSession && state.currentSession.id === action.payload.id) {
          state.currentSession = action.payload;
        }
        state.error = null;
      })
      .addCase(updateSessionScheduling.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Add interview to session
      .addCase(addInterviewToSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addInterviewToSession.fulfilled, (state, action) => {
        state.loading = false;
        const { sessionId, interview } = action.payload;

        // Find and update the session with the new interview
        const sessionIndex = state.sessions.findIndex(session => session.id === sessionId);
        if (sessionIndex !== -1) {
          const currentSession = state.sessions[sessionIndex];
          state.sessions[sessionIndex] = {
            ...currentSession,
            preferences: {
              ...currentSession.preferences,
              interviews: [...(currentSession.preferences?.interviews || []), interview]
            },
            updated_at: new Date().toISOString()
          };
        }

        // Also update currentSession if it matches
        if (state.currentSession && state.currentSession.id === sessionId) {
          state.currentSession = {
            ...state.currentSession,
            preferences: {
              ...state.currentSession.preferences,
              interviews: [...(state.currentSession.preferences?.interviews || []), interview]
            },
            updated_at: new Date().toISOString()
          };
        }

        state.error = null;
      })
      .addCase(addInterviewToSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update interview
      .addCase(updateInterview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInterview.fulfilled, (state, action) => {
        state.loading = false;
        const { interviewId, interview } = action.payload;

        // Find and update the interview in all sessions
        state.sessions.forEach((session, sessionIndex) => {
          const interviews = session.preferences?.interviews || [];
          const interviewIndex = interviews.findIndex(int => int.id === interviewId);

          if (interviewIndex !== -1) {
            state.sessions[sessionIndex] = {
              ...session,
              preferences: {
                ...session.preferences,
                interviews: [
                  ...interviews.slice(0, interviewIndex),
                  interview,
                  ...interviews.slice(interviewIndex + 1)
                ]
              },
              updated_at: new Date().toISOString()
            };
          }
        });

        // Also update currentSession if it contains the interview
        if (state.currentSession) {
          const interviews = state.currentSession.preferences?.interviews || [];
          const interviewIndex = interviews.findIndex(int => int.id === interviewId);

          if (interviewIndex !== -1) {
            state.currentSession = {
              ...state.currentSession,
              preferences: {
                ...state.currentSession.preferences,
                interviews: [
                  ...interviews.slice(0, interviewIndex),
                  interview,
                  ...interviews.slice(interviewIndex + 1)
                ]
              },
              updated_at: new Date().toISOString()
            };
          }
        }

        state.error = null;
      })
      .addCase(updateInterview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete session
      .addCase(deleteSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = state.sessions.filter(session => session.id !== action.payload.sessionId);
        if (state.currentSession && state.currentSession.id === action.payload.sessionId) {
          state.currentSession = null;
        }
        state.error = null;
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch session stats
      .addCase(fetchSessionStats.pending, (state) => {
        // console.log('🔄 fetchSessionStats.pending - Starting stats fetch...');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionStats.fulfilled, (state, action) => {
        // console.log('✅ fetchSessionStats.fulfilled - Stats received:', action.payload);
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchSessionStats.rejected, (state, action) => {
        // console.log('❌ fetchSessionStats.rejected - Stats fetch failed:', action.payload);
        state.loading = false;
        state.error = action.payload;
        // Don't reset stats to null, keep previous stats if available
        // state.stats = null; // Commented out to preserve previous stats
      })

      // Upload interview file (synchronous)
      .addCase(uploadInterviewFile.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadInterviewFile.fulfilled, (state, action) => {
        state.uploadLoading = false;
        const { interviewId, interview } = action.payload;

        // Update currentSession if it contains the interview
        if (state.currentSession) {
          const interviews = state.currentSession.preferences?.interviews || [];
          const interviewIndex = interviews.findIndex(int => int.id === interviewId);

          if (interviewIndex !== -1) {
            state.currentSession = {
              ...state.currentSession,
              preferences: {
                ...state.currentSession.preferences,
                interviews: [
                  ...interviews.slice(0, interviewIndex),
                  interview, // Updated interview with file upload, transcription, draft, and completed status
                  ...interviews.slice(interviewIndex + 1)
                ]
              },
              updated_at: new Date().toISOString()
            };

            // Also update in sessions array if it exists
            const sessionIndex = state.sessions.findIndex(s => s.id === state.currentSession.id);
            if (sessionIndex !== -1) {
              state.sessions[sessionIndex] = state.currentSession;
            }
          }
        }

        state.error = null;
      })
      .addCase(uploadInterviewFile.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload;
      })

      // Upload interview file (async)
      .addCase(uploadInterviewFileAsync.pending, (state) => {
        state.uploadLoading = true;
        state.error = null;
      })
      .addCase(uploadInterviewFileAsync.fulfilled, (state, action) => {
        state.uploadLoading = false;
        const { interviewId, interview } = action.payload;

        // Update currentSession if it contains the interview
        if (state.currentSession) {
          const interviews = state.currentSession.preferences?.interviews || [];
          const interviewIndex = interviews.findIndex(int => int.id === interviewId);

          if (interviewIndex !== -1) {
            state.currentSession = {
              ...state.currentSession,
              preferences: {
                ...state.currentSession.preferences,
                interviews: [
                  ...interviews.slice(0, interviewIndex),
                  interview, // Updated interview with file upload and transcribing status
                  ...interviews.slice(interviewIndex + 1)
                ]
              },
              updated_at: new Date().toISOString()
            };

            // Also update in sessions array if it exists
            const sessionIndex = state.sessions.findIndex(s => s.id === state.currentSession.id);
            if (sessionIndex !== -1) {
              state.sessions[sessionIndex] = state.currentSession;
            }
          }
        }

        state.error = null;
      })
      .addCase(uploadInterviewFileAsync.rejected, (state, action) => {
        state.uploadLoading = false;
        state.error = action.payload;
      })

      // Regenerate draft
      .addCase(regenerateDraft.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(regenerateDraft.fulfilled, (state, action) => {
        state.loading = false;
        // The regenerate action creates a new draft version
        // We don't need to update the sessions state since the draft is in a separate table
        // The parent component will refresh the data after regeneration
        state.error = null;
      })
      .addCase(regenerateDraft.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

// Export actions
export const {
  clearError,
  setCurrentSession,
  setFilters,
  clearFilters,
  setPagination
} = sessionsSliceSupabase.actions;

// Export reducer
export default sessionsSliceSupabase.reducer;
