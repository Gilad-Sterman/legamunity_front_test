import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk for fetching drafts with filtering and pagination
export const fetchDrafts = createAsyncThunk(
  'drafts/fetchDrafts',
  async (params = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
        // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.stage && params.stage !== 'all') queryParams.append('stage', params.stage);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.progress && params.progress !== 'all') queryParams.append('progress', params.progress);
      if (params.dateRange) {
        queryParams.append('startDate', params.dateRange.start);
        queryParams.append('endDate', params.dateRange.end);
      }
      
      const queryString = queryParams.toString();
      const url = `/api/admin/drafts${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch drafts');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching a single draft by ID
export const fetchDraftById = createAsyncThunk(
  'drafts/fetchDraftById',
  async (draftId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/drafts/${draftId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch draft');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching drafts by session
export const fetchDraftsBySession = createAsyncThunk(
  'drafts/fetchDraftsBySession',
  async (sessionId, { rejectWithValue, getState }) => {
    try {
      // Get token from auth state
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        return rejectWithValue('No authentication token available');
      }

      const response = await fetch(`/api/sessions-supabase/${sessionId}/drafts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch session drafts');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for adding note to draft (Supabase)
export const addNoteToDraft = createAsyncThunk(
  'drafts/addNoteToDraft',
  async ({ sessionId, draftId, content, author }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        return rejectWithValue('No authentication token available');
      }

      const response = await fetch(`/api/sessions-supabase/${sessionId}/drafts/${draftId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          content,
          author: author || 'Admin User'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to add note to draft');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating draft stage (Supabase)
export const updateDraftStageSupabase = createAsyncThunk(
  'drafts/updateDraftStageSupabase',
  async ({ sessionId, draftId, stage, rejectionReason, approvedBy, rejectedBy }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const token = auth.token;

      if (!token) {
        return rejectWithValue('No authentication token available');
      }

      const response = await fetch(`/api/sessions-supabase/${sessionId}/drafts/${draftId}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          stage,
          rejectionReason,
          approvedBy: approvedBy || 'Admin User',
          rejectedBy: rejectedBy || 'Admin User'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update draft stage');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating draft content
export const updateDraftContent = createAsyncThunk(
  'drafts/updateDraftContent',
  async ({ draftId, content }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/drafts/${draftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update draft');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating draft stage (enhanced with validation)
export const updateDraftStage = createAsyncThunk(
  'drafts/updateDraftStage',
  async ({ draftId, targetStage, reason, rejectionReason, adminUser }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const response = await fetch(`/api/test-drafts/test-stage-transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ 
          draftId, 
          targetStage, 
          reason, 
          rejectionReason,
          adminUser: adminUser || {
            id: auth.user?.uid || 'admin-001',
            name: auth.user?.displayName || 'Admin User',
            email: auth.user?.email || 'admin@test.com',
            role: 'admin'
          }
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to update draft stage');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for approving draft
export const approveDraft = createAsyncThunk(
  'drafts/approveDraft',
  async ({ draftId, notes }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const response = await fetch(`/api/test-drafts/test-stage-transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ 
          draftId, 
          targetStage: 'approved',
          reason: notes || 'Draft approved',
          adminUser: {
            id: auth.user?.uid || 'admin-001',
            name: auth.user?.displayName || 'Admin User',
            email: auth.user?.email || 'admin@test.com',
            role: 'admin'
          }
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to approve draft');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for rejecting draft
export const rejectDraft = createAsyncThunk(
  'drafts/rejectDraft',
  async ({ draftId, reason }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const response = await fetch(`/api/test-drafts/test-stage-transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ 
          draftId, 
          targetStage: 'rejected',
          rejectionReason: reason,
          adminUser: {
            id: auth.user?.uid || 'admin-001',
            name: auth.user?.displayName || 'Admin User',
            email: auth.user?.email || 'admin@test.com',
            role: 'admin'
          }
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to reject draft');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for fetching draft history
export const fetchDraftHistory = createAsyncThunk(
  'drafts/fetchDraftHistory',
  async (draftId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const response = await fetch(`/api/test-drafts/test-history/${draftId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch draft history');
      }
      
      return data.history || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for exporting draft
export const exportDraft = createAsyncThunk(
  'drafts/exportDraft',
  async ({ draftId, format }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/admin/drafts/${draftId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        return rejectWithValue(data.message || 'Failed to export draft');
      }
      
      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `draft-${draftId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { draftId, format };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for simulating interview completion (testing)
export const simulateInterviewCompletion = createAsyncThunk(
  'drafts/simulateInterviewCompletion',
  async ({ sessionId, interviewId }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const response = await fetch('/api/test-drafts/simulate-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ sessionId, interviewId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to simulate interview completion');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for simulating multiple interviews (testing)
export const simulateMultipleInterviews = createAsyncThunk(
  'drafts/simulateMultipleInterviews',
  async ({ sessionId }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      
      const response = await fetch('/api/test-drafts/simulate-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to simulate multiple interviews');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  items: [],
  currentDraft: null,
  draftHistory: [],
  sessionDraftsCount: 0,
  loading: false,
  error: null,
  filters: {
    stage: 'all',
    search: '',
    progress: 'all',
    dateRange: null,
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }
};

const draftsSlice = createSlice({
  name: 'drafts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDraft: (state, action) => {
      state.currentDraft = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        stage: 'all',
        search: '',
        progress: 'all',
        dateRange: null,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCurrentDraft: (state) => {
      state.currentDraft = null;
      state.draftHistory = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch drafts
      .addCase(fetchDrafts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrafts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.pagination = {
          ...state.pagination,
          total: action.payload.total,
          totalPages: action.payload.totalPages
        };
      })
      .addCase(fetchDrafts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch draft by ID
      .addCase(fetchDraftById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDraftById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDraft = action.payload;
      })
      .addCase(fetchDraftById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch drafts by session
      .addCase(fetchDraftsBySession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDraftsBySession.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data;
        state.sessionDraftsCount = action.payload.count;
      })
      .addCase(fetchDraftsBySession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update draft content
      .addCase(updateDraftContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDraftContent.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDraft = action.payload;
        // Update in items list if present
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateDraftContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update draft stage
      .addCase(updateDraftStage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDraftStage.fulfilled, (state, action) => {
        state.loading = false;
        
        // Preserve enriched data while updating stage-related fields
        if (state.currentDraft && state.currentDraft.id === action.payload.id) {
          state.currentDraft = {
            ...state.currentDraft,
            stage: action.payload.stage,
            content: action.payload.content,
            updated_at: action.payload.updated_at
          };
        }
        
        // Update in items list if present, preserving ALL enriched data
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          const existingDraft = state.items[index];
          
          // Recalculate draft statistics after stage change
          const totalDrafts = state.items.length;
          const approvedDrafts = state.items.filter((draft, i) => 
            i === index ? action.payload.stage === 'approved' : draft.stage === 'approved'
          ).length;
          const rejectedDrafts = state.items.filter((draft, i) => 
            i === index ? action.payload.stage === 'rejected' : draft.stage === 'rejected'
          ).length;
          const pendingDrafts = totalDrafts - approvedDrafts - rejectedDrafts;
          
          // Update session_info with new draft statistics
          const updatedSessionInfo = {
            ...(existingDraft.session_info || {}), // Handle case where session_info might be null/undefined
            total_drafts: totalDrafts,
            approved_drafts: approvedDrafts,
            rejected_drafts: rejectedDrafts,
            pending_drafts: pendingDrafts
          };
          

          
          state.items[index] = {
            ...existingDraft, // Preserve ALL enriched data
            stage: action.payload.stage,
            content: action.payload.content,
            updated_at: action.payload.updated_at,
            // Explicitly preserve key enriched fields
            interview_name: existingDraft.interview_name,
            interview_type: existingDraft.interview_type,
            session_info: updatedSessionInfo, // Updated statistics
            completion_percentage: existingDraft.completion_percentage
          };
          
          // Update session_info for all drafts in the same session to keep them in sync
          // Since we're in SessionDrafts page, all drafts should be from the same session
          state.items.forEach((draft, i) => {
            if (i !== index) {
              // If the draft doesn't have session_info, create it from the updated draft
              if (!draft.session_info && updatedSessionInfo) {
                draft.session_info = { ...updatedSessionInfo };
              } else if (draft.session_info) {
                draft.session_info = {
                  ...draft.session_info,
                  total_drafts: totalDrafts,
                  approved_drafts: approvedDrafts,
                  rejected_drafts: rejectedDrafts,
                  pending_drafts: pendingDrafts
                };
              }
              
              // Also ensure other enriched fields are preserved/added if missing
              if (!draft.completion_percentage && existingDraft.completion_percentage) {
                draft.completion_percentage = existingDraft.completion_percentage;
              }
              if (!draft.interview_name && existingDraft.interview_name) {
                draft.interview_name = existingDraft.interview_name;
              }
              if (!draft.interview_type && existingDraft.interview_type) {
                draft.interview_type = existingDraft.interview_type;
              }
            }
          });
          
          // Also update currentDraft if it exists and matches
          if (state.currentDraft && state.currentDraft.session_info) {
            state.currentDraft.session_info = {
              ...state.currentDraft.session_info,
              total_drafts: totalDrafts,
              approved_drafts: approvedDrafts,
              rejected_drafts: rejectedDrafts,
              pending_drafts: pendingDrafts
            };
          }
        }
      })
      .addCase(updateDraftStage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Export draft
      .addCase(exportDraft.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(exportDraft.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(exportDraft.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch draft history
      .addCase(fetchDraftHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDraftHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.draftHistory = action.payload;
      })
      .addCase(fetchDraftHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add note to draft (Supabase)
      .addCase(addNoteToDraft.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addNoteToDraft.fulfilled, (state, action) => {
        state.loading = false;
        // Update the draft with new note
        const updatedDraft = action.payload.data;
        const index = state.items.findIndex(item => item.id === updatedDraft.id);
        if (index !== -1) {
          state.items[index] = updatedDraft;
        }
        if (state.currentDraft && state.currentDraft.id === updatedDraft.id) {
          state.currentDraft = updatedDraft;
        }
      })
      .addCase(addNoteToDraft.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update draft stage (Supabase)
      .addCase(updateDraftStageSupabase.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDraftStageSupabase.fulfilled, (state, action) => {
        state.loading = false;
        // Update the draft with new stage
        const updatedDraft = action.payload.data;
        const index = state.items.findIndex(item => item.id === updatedDraft.id);
        if (index !== -1) {
          state.items[index] = updatedDraft;
        }
        if (state.currentDraft && state.currentDraft.id === updatedDraft.id) {
          state.currentDraft = updatedDraft;
        }
      })
      .addCase(updateDraftStageSupabase.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  setCurrentDraft, 
  setFilters, 
  clearFilters, 
  setPagination,
  clearCurrentDraft 
} = draftsSlice.actions;

export default draftsSlice.reducer;
