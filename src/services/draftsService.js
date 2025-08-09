/**
 * Drafts Service
 * Frontend service for interacting with drafts API
 */

// Using relative URL to avoid CORS/CSP issues in production
const API_BASE_URL = '/api';

class DraftsService {
  
  /**
   * Get all drafts with filtering and pagination
   */
  async getAllDrafts(filters = {}, token = null) {
    try {
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/admin/drafts${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch drafts');
      }

      return {
        success: true,
        data: data.data,
        message: data.message,
        pagination: data.pagination
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get draft by ID
   */
  async getDraftById(draftId, token = null) {
    try {
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/drafts/${draftId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch draft');
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
   * Get all drafts for a specific session
   */
  async getDraftsBySession(sessionId, token = null) {
    try {
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/sessions/${sessionId}/drafts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch session drafts');
      }

      return {
        success: true,
        data: data.data,
        count: data.count,
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
   * Update draft content
   */
  async updateDraftContent(draftId, content, token = null) {
    try {
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/drafts/${draftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update draft content');
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
   * Update draft stage
   */
  async updateDraftStage(draftId, stage, reason = '', token = null) {
    try {
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/drafts/${draftId}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ stage, reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update draft stage');
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
   * Export draft
   */
  async exportDraft(draftId, format = 'pdf', token = null) {
    try {
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/drafts/${draftId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ format }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to export draft');
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
   * Get draft history
   */
  async getDraftHistory(draftId, filters = {}, token = null) {
    try {
      const authToken = token || localStorage.getItem('authToken') || localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      const queryString = params.toString();
      const url = `${API_BASE_URL}/admin/drafts/${draftId}/history${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch draft history');
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
}

export default new DraftsService();
