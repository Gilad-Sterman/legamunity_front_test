/**
 * Supabase Sessions Service
 * Frontend service for interacting with Supabase sessions API
 */

// Using relative URL to avoid CORS/CSP issues in production
const API_BASE_URL = '/api';

class SupabaseSessionsService {
  /**
   * Get all sessions with filtering and pagination
   */
  async getSessions(params = {}, token = null) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status && params.status !== 'all') queryParams.append('status', params.status);
      if (params.priority_level && params.priority_level !== 'all') queryParams.append('priority_level', params.priority_level);
      if (params.session_type && params.session_type !== 'all') queryParams.append('session_type', params.session_type);
      if (params.preferred_language && params.preferred_language !== 'all') queryParams.append('preferred_language', params.preferred_language);
      if (params.search) queryParams.append('search', params.search);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/sessions-supabase${queryString ? `?${queryString}` : ''}`;

      // Use provided token or fallback to localStorage
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch sessions');
      }

      return {
        success: true,
        data: data.data,
        pagination: data.pagination,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch session');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions-supabase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create session');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update session
   */
  async updateSession(sessionId, updateData) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update session');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update session scheduling
   */
  async updateSessionScheduling(sessionId, schedulingData) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/${sessionId}/scheduling`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ scheduling_details: schedulingData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update session scheduling');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add interview to session
   */
  async addInterviewToSession(sessionId, interviewData) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/${sessionId}/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(interviewData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add interview');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update interview
   */
  async updateInterview(interviewId, updateData) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/interviews/${interviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update interview');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get session statistics
   */
  // async getSessionStats() {
  //   try {
  //     const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  //     const response = await fetch(`${API_BASE_URL}/sessions-supabase/stats`, {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`,
  //       },
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.message || 'Failed to fetch session statistics');
  //     }

  //     return {
  //       success: true,
  //       data: data.data,
  //       message: data.message
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error.message
  //     };
  //   }
  // }

  async getSessionStats() {
    try {
      // console.log('🚀 Frontend: Starting getSessionStats API call...');
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      // console.log('📊 Frontend: Received stats response:', { 
        // ok: response.ok, 
        // status: response.status, 
        // data: data.data,
        // success: data.success 
      // });

      if (!response.ok) {
        // console.error('❌ Frontend: Error fetching session stats:', data.message);
        throw new Error(data.message || 'Failed to fetch session statistics');
      }

      // console.log('✅ Frontend: Successfully processed stats:', data.data);
      return {
        success: true,
        data: data.data || {
          totalSessions: 0,
          activeSessions: 0,
          averageCqs: 0,
          pendingReview: 0
        },
        message: data.message
      };
    } catch (error) {
      console.error('💥 Frontend: getSessionStats failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Regenerate an existing draft with additional notes and instructions
   */
  async regenerateDraft(sessionId, draftId, instructions, notes) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/${sessionId}/drafts/${draftId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          instructions: instructions || '',
          notes: notes || []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to regenerate draft');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload interview file with AI processing
   */
  async uploadInterviewFile(interviewId, file) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/interviews/${interviewId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - let browser set it with boundary for FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload file');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete a session by ID
   */
  async deleteSession(sessionId) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete session');
      }

      return { success: true, data: { sessionId }, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete an interview by ID
   */
  async deleteInterview(interviewId, sessionId) {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/sessions-supabase/${sessionId}/interviews/${interviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete interview');
      }

      return { success: true, data: { interviewId, session: data.data }, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update session name
   */
  async updateSessionName(sessionId, name) {
    return this.updateSession(sessionId, { name });
  }

}

// Create and export a singleton instance
const supabaseSessionsService = new SupabaseSessionsService();
export default supabaseSessionsService;
