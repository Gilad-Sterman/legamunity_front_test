import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Users,
  FileText,
  Upload,
  Phone,
  Mail,
  AlertCircle,
  Calendar,
  Play,
  X,
  Trash,
  Database
} from 'lucide-react';
import {
  fetchSessions,
  setFilters,
  clearFilters,
  setPagination,
  clearError,
  updateInterview,
  addInterviewToSession,
  updateSessionScheduling,
  deleteSession,
  deleteInterview
} from '../../store/slices/sessionsSliceSupabase';
import {
  fetchSessionInterviews,
  createInterview,
  updateInterview as updateNormalizedInterview,
  deleteInterview as deleteNormalizedInterview
} from '../../store/slices/interviewsSlice';
import CreateSessionModal from '../../components/admin/sessions/CreateSessionModal';
import FileUpload from '../../components/admin/interviews/FileUpload';
import MigrationPanel from '../../components/admin/migration/MigrationPanel';

const Sessions = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    sessions,
    pagination,
    filters,
    loading,
    error,
    createLoading,
    updateLoading,
    deleteLoading
  } = useSelector(state => state.sessions);

  // Normalized interviews state
  const {
    interviewsBySession,
    sessionLoading: interviewSessionLoading,
    createLoading: interviewCreateLoading,
    updateLoading: interviewUpdateLoading,
    deleteLoading: interviewDeleteLoading
  } = useSelector(state => state.interviews);

  const [expandedSessions, setExpandedSessions] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [editInterviewName, setEditInterviewName] = useState('');
  const [editInterviewIsFriend, setEditInterviewIsFriend] = useState(false);
  const [showSchedulingModal, setShowSchedulingModal] = useState(null);
  const [showFileUploadModal, setShowFileUploadModal] = useState(null);
  const [showFileViewModal, setShowFileViewModal] = useState(null);
  const [showDraftViewModal, setShowDraftViewModal] = useState(null);
  const [showMigrationPanel, setShowMigrationPanel] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: '',
    startTime: '',
    duration: 60,
    location: 'online',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [selectedStatus, setSelectedStatus] = useState(filters.status); // Changed from selectedStage to selectedStatus
  const [selectedPriority, setSelectedPriority] = useState(filters.priority_level); // Added priority filter

  // Helper function to get interviews with fallback logic
  const getSessionInterviews = (session) => {
    // Priority: normalized interviews > legacy interviews > empty array
    const normalizedInterviews = interviewsBySession[session.id];
    const legacyInterviews = session.preferences?.interviews || session.interviews;
    
    return normalizedInterviews || legacyInterviews || [];
  };

  // Load sessions on component mount and when filters change
  useEffect(() => {
    const params = {
      page: pagination.currentPage,
      limit: pagination.limit,
      search: filters.search,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    };

    // Only add status filter if not filtering by interview status
    if (filters.status && filters.status !== 'all' && !filters.status.startsWith('interview_')) {
      params.status = filters.status;
    }

    dispatch(fetchSessions(params));
  }, [dispatch, pagination.currentPage, pagination.limit, filters]);

  // Fetch normalized interviews when sessions are expanded
  useEffect(() => {
    Object.keys(expandedSessions).forEach(sessionId => {
      if (expandedSessions[sessionId] && !interviewsBySession[sessionId] && !interviewSessionLoading[sessionId]) {
        dispatch(fetchSessionInterviews(sessionId));
      }
    });
  }, [dispatch, expandedSessions, interviewsBySession, interviewSessionLoading]);

  // Apply client-side filtering for nested fields and interview status
  const filteredSessions = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    return sessions.filter(session => {
      // Filter by priority level (nested in preferences)
      if (filters.priority_level && filters.priority_level !== 'all') {
        const sessionPriority = session.preferences?.priority_level || 'standard';
        if (sessionPriority !== filters.priority_level) return false;
      }

      // Filter by interview status
      if (filters.status && filters.status.startsWith('interview_')) {
        const interviewStatus = filters.status.replace('interview_', '');
        if (interviewStatus !== 'all') {
          // Check if any interview has the selected status using helper function
          const interviews = getSessionInterviews(session);
          const hasMatchingInterview = interviews.some(interview => interview.status === interviewStatus);
          if (!hasMatchingInterview) return false;
        }
      }
      
      // Search filter for client name and main contact
      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = filters.search.toLowerCase().trim();
        
        // Get client name (first_name and last_name)
        const clientName = session.client_name.toLowerCase() || '';
        const clientEmail = session.client_email.toLowerCase() || '';
        
        // Get main contact information
        const mainContact = session.client_contact || {};
        
        // Check if search term matches any of these fields
        const matchesClientName = clientName.includes(searchTerm);
        const matchesClientEmail = clientEmail.includes(searchTerm);
        
        // Return false if no match found
        if (!matchesClientName && !matchesClientEmail) {
          return false;
        }
      }

      return true;
    });
  }, [sessions, filters]);

  // Handle search input
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounce search
    const timeoutId = setTimeout(() => {
      dispatch(setFilters({ search: value }));
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Handle status filter change (changed from stage to status)
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    dispatch(setFilters({ status }));
  };

  // Handle interview status filter change
  const handleInterviewStatusFilter = (status) => {
    setSelectedStatus(`interview_${status}`);
    dispatch(setFilters({ status: `interview_${status}` }));
  };

  // Handle priority filter change
  const handlePriorityFilter = (priority_level) => {
    setSelectedPriority(priority_level);
    dispatch(setFilters({ priority_level }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    dispatch(setPagination({ currentPage: newPage }));
  };

  // Toggle session expansion
  const toggleSessionExpansion = (sessionId) => {
    const newExpanded = { ...expandedSessions };
    if (newExpanded[sessionId]) {
      delete newExpanded[sessionId];
    } else {
      newExpanded[sessionId] = true;
    }
    setExpandedSessions(newExpanded);
  };

  // Handle interview editing
  const handleEditInterview = (sessionId, interview) => {
    setEditingInterview({ sessionId, interviewId: interview.id, content: interview.content });
    // Get name from content.name (normalized) or interview.name (legacy) or notes field
    const interviewName = interview.content?.name || interview.name || interview.notes || `Interview ${interview.id}`;
    const isFriendInterview = interview.content?.isFriendInterview || interview.isFriendInterview || false;
    
    setEditInterviewName(interviewName);
    setEditInterviewIsFriend(isFriendInterview);
  };

  const handleSaveInterviewName = async () => {
    if (!editingInterview || !editInterviewName.trim()) return;

    try {
      // Use normalized interview update with correct field names
      await dispatch(updateNormalizedInterview({
        interviewId: editingInterview.interviewId,
        updateData: {
          // The normalized table uses 'notes' field to store interview name/description
          notes: editInterviewName.trim(),
          // Add friend interview info to content field as JSON
          content: {
            ...editingInterview.content,
            isFriendInterview: editInterviewIsFriend,
            name: editInterviewName.trim()
          }
        }
      })).unwrap();

      setEditingInterview(null);
      setEditInterviewName('');
      setEditInterviewIsFriend(false);
    } catch (error) {
      console.error('Failed to update interview:', error);
    }
  };

  const handleCancelEditInterview = () => {
    setEditingInterview(null);
    setEditInterviewName('');
    setEditInterviewIsFriend(false);
  };

  // Handle adding new interview
  const handleAddInterview = async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    const scheduling = session?.preferences?.interview_scheduling || session?.interview_scheduling;
    const hasSchedule = scheduling?.enabled;

    const newInterviewData = {
      type: 'life_story',
      notes: '',
      status: hasSchedule ? 'scheduled' : 'pending',
      duration: hasSchedule ? (scheduling.duration || 90) : 90,
      location: hasSchedule ? (scheduling.location || 'online') : 'online',
      is_friend_interview: false
    };

    try {
      // Use normalized interview creation
      await dispatch(createInterview({ sessionId, interviewData: newInterviewData })).unwrap();
      
      // Refresh sessions data to show updated interview count and metrics
      await dispatch(fetchSessions({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        status: filters.status && !filters.status.startsWith('interview_') ? filters.status : undefined
      }));

      // Also refresh normalized interviews
      await dispatch(fetchSessionInterviews(sessionId));
    } catch (error) {
      console.error('Failed to create interview:', error);
    }
  };

  // Handle deleting an interview
  const handleDeleteInterview = async (sessionId, interviewId) => {
    const confirmDelete = window.confirm(t('admin.sessions.deleteInterviewConfirm', 'Are you sure you want to delete this interview?'));
    if (!confirmDelete) return;

    try {
      // Use normalized interview deletion
      await dispatch(deleteNormalizedInterview(interviewId)).unwrap();
      
      // Refresh sessions data to show updated interview count and metrics
      await dispatch(fetchSessions({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        status: filters.status && !filters.status.startsWith('interview_') ? filters.status : undefined
      }));

      // Also refresh normalized interviews
      await dispatch(fetchSessionInterviews(sessionId));
    } catch (error) {
      console.error('Failed to delete interview:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    const confirmDelete = window.confirm(t('admin.sessions.deleteConfirm', 'Are you sure you want to delete this session?'));
    if (!confirmDelete) return;
    try {
      await dispatch(deleteSession(sessionId)).unwrap();
      dispatch(fetchSessions({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      }));
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // const handleDeleteInterview = async (sessionId, interviewId) => {
  //   const confirmDelete = window.confirm(t('admin.sessions.deleteConfirm', `Are you sure you want to delete this interview?`));
  //   if (!confirmDelete) return;
  //   try {
  //     await dispatch(deleteInterview({ sessionId, interviewId })).unwrap();
  //     dispatch(fetchSessions({
  //       page: pagination.currentPage,
  //       limit: pagination.limit,
  //       ...filters
  //     }));
  //   } catch (error) {
  //     console.error('Failed to delete interview:', error);
  //   }
  // };

  // Handle scheduling modal
  const handleShowScheduling = (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session?.preferences?.interview_scheduling?.enabled) {
      // Pre-fill form with existing schedule
      setScheduleForm({
        dayOfWeek: session.preferences.interview_scheduling.day_of_week || '',
        startTime: session.preferences.interview_scheduling.start_time || '',
        duration: session.preferences.interview_scheduling.duration || 60,
        location: session.preferences.interview_scheduling.location || 'online',
        notes: session.preferences.interview_scheduling.notes || ''
      });
    } else {
      // Reset form for new schedule
      setScheduleForm({
        dayOfWeek: '',
        startTime: '',
        duration: 60,
        location: 'online',
        notes: ''
      });
    }
    setShowSchedulingModal(sessionId);
  };

  const handleCloseScheduling = () => {
    setShowSchedulingModal(null);
    setScheduleForm({
      dayOfWeek: '',
      startTime: '',
      duration: 60,
      location: 'online',
      notes: ''
    });
  };

  const handleScheduleFormChange = (field, value) => {
    setScheduleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSchedule = async () => {
    if (!showSchedulingModal || !scheduleForm.dayOfWeek || !scheduleForm.startTime) {
      alert(t('admin.sessions.scheduleValidationError', 'Please fill in all required fields'));
      return;
    }

    try {
      await dispatch(updateSessionScheduling({
        sessionId: showSchedulingModal,
        schedulingData: {
          enabled: true,
          day_of_week: scheduleForm.dayOfWeek,
          start_time: scheduleForm.startTime,
          duration: scheduleForm.duration,
          location: scheduleForm.location,
          notes: scheduleForm.notes
        }
      })).unwrap();

      // Refresh sessions data to show updated interview durations and total duration
      await dispatch(fetchSessions({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        status: filters.status && !filters.status.startsWith('interview_') ? filters.status : undefined
      }));

      // Also refresh normalized interviews if using the new data structure
      if (showSchedulingModal) {
        await dispatch(fetchSessionInterviews(showSchedulingModal));
      }

      handleCloseScheduling();
      alert(t('admin.sessions.scheduleUpdated', 'Schedule updated successfully. All non-completed interviews have been updated with new duration and location.'));
    } catch (error) {
      console.error('Failed to update schedule:', error);
      alert(t('admin.sessions.scheduleUpdateError', 'Failed to update schedule'));
    }
  };

  // Handle file upload modal
  const handleShowFileUpload = (interviewId) => {
    setShowFileUploadModal(interviewId);
  };

  const handleCloseFileUpload = () => {
    setShowFileUploadModal(null);
  };

  const handleShowFileView = (interview) => {
    // Create a normalized interview object for the modal
    const fileData = interview.file_upload || interview.content?.file_upload;
    const transcription = interview.transcription || interview.content?.transcription;
    
    const modalData = {
      ...interview,
      file_upload: fileData,
      transcription: transcription
    };
    
    setShowFileViewModal(modalData);
  };

  const handleCloseFileView = () => {
    setShowFileViewModal(null);
  };

  const handleShowDraftView = (interview) => {
    // Create a normalized interview object for the modal
    const draftData = interview.ai_draft || interview.content?.ai_draft;
    
    const modalData = {
      ...interview,
      ai_draft: draftData
    };
    
    setShowDraftViewModal(modalData);
  };

  const handleCloseDraftView = () => {
    setShowDraftViewModal(null);
  };

  // Handle file upload success for normalized interviews
  const handleFileUploadSuccess = async (updatedInterview) => {
    try {
      // Close the file upload modal first
      setShowFileUploadModal(null);
      
      // Refresh sessions data to show updated completion percentage and metrics
      await dispatch(fetchSessions({
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        status: filters.status && !filters.status.startsWith('interview_') ? filters.status : undefined
      }));

      // Also refresh normalized interviews if using the new data structure
      if (updatedInterview && updatedInterview.session_id) {
        await dispatch(fetchSessionInterviews(updatedInterview.session_id));
      }
    } catch (error) {
      console.error('Failed to refresh data after file upload:', error);
    }
  };

  // Get status badge class (changed from stage to status)
  const getStatusClass = (status) => {
    const statusClasses = {
      'scheduled': 'session-badge session-badge--scheduled',
      'active': 'session-badge session-badge--active', // Changed from 'in-progress' to 'active'
      'pending_review': 'session-badge session-badge--pending',
      'completed': 'session-badge session-badge--completed',
      'cancelled': 'session-badge session-badge--cancelled'
    };
    return statusClasses[status] || 'session-badge';
  };

  const getTranslatedStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'in progress':
        return t('admin.sessions.status.inProgress');
      case 'pending review':
        return t('admin.sessions.status.pendingReview');
      case 'pending':
        return t('admin.sessions.status.pending');
      case 'scheduled':
        return t('admin.sessions.status.scheduled');
      case 'active':
        return t('admin.sessions.status.active');
      case 'completed':
        return t('admin.sessions.status.completed');
      case 'cancelled':
        return t('admin.sessions.status.cancelled');
      default:
        return status || 'N/A';
    }
  };

  // Get priority badge class
  const getPriorityClass = (priority_level) => {
    const priorityClasses = {
      'standard': 'priority-badge priority-badge--standard',
      'urgent': 'priority-badge priority-badge--urgent',
      'memorial': 'priority-badge priority-badge--memorial'
    };
    return priorityClasses[priority_level] || 'priority-badge';
  };

  const getTranslatedPriority = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'standard':
        return t('admin.sessions.priorities.standard');
      case 'urgent':
        return t('admin.sessions.priorities.urgent');
      case 'memorial':
        return t('admin.sessions.priorities.memorial');
      default:
        return priority || 'N/A';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);

  return (
    <div className="admin-page sessions-page">
      <header className="admin-page__header">
        <div className="admin-page__header-content">
          <h1 className="admin-page__title">{t('admin.sessions.title', 'Sessions Management')}</h1>
          <button
            className="btn btn--primary"
            onClick={() => setShowCreateModal(true)}
            disabled={createLoading}
          >
            <Plus size={20} />
            {t('admin.sessions.createNew', 'Create New Session')}
          </button>
        </div>
      </header>

      <div className="admin-page__content">
        {/* Filters and Search */}
        <div className="sessions-filters">
          <div className="sessions-filters__search">
            <Search className="sessions-filters__search-icon" size={20} />
            <input
              type="text"
              placeholder={t('admin.sessions.search', 'Search sessions...')}
              value={searchTerm}
              onChange={handleSearch}
              className="sessions-filters__search-input"
            />
          </div>

          <div className="sessions-filters__status">
            <Filter size={20} />
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="sessions-filters__status-select"
            >
              <option value="all">{t('admin.sessions.filters.allStatuses', 'All Statuses')}</option>
              <option value="scheduled">{getTranslatedStatus('scheduled')}</option>
              <option value="active">{getTranslatedStatus('active')}</option>
              <option value="pending_review">{getTranslatedStatus('pending_review')}</option>
              <option value="completed">{getTranslatedStatus('completed')}</option>
              <option value="cancelled">{getTranslatedStatus('cancelled')}</option>
            </select>
          </div>

          <div className="sessions-filters__interview-status">
            <Filter size={20} />
            <select
              value={selectedStatus.startsWith('interview_') ? selectedStatus.replace('interview_', '') : 'all'}
              onChange={(e) => handleInterviewStatusFilter(e.target.value)}
              className="sessions-filters__interview-status-select"
            >
              <option value="all">{t('admin.sessions.filters.allInterviewStatuses', 'All Interview Statuses')}</option>
              <option value="scheduled">{getTranslatedStatus('scheduled')}</option>
              <option value="completed">{getTranslatedStatus('completed')}</option>
              <option value="pending">{getTranslatedStatus('pending')}</option>
            </select>
          </div>

          <div className="sessions-filters__priority">
            <Filter size={20} />
            <select
              value={selectedPriority}
              onChange={(e) => handlePriorityFilter(e.target.value)}
              className="sessions-filters__priority-select"
            >
              <option value="all">{t('admin.sessions.filters.allPriorities', 'All Priorities')}</option>
              <option value="standard">{getTranslatedPriority('standard')}</option>
              <option value="urgent">{getTranslatedPriority('urgent')}</option>
              <option value="memorial">{getTranslatedPriority('memorial')}</option>
            </select>
          </div>

          <button
            className="btn btn--secondary"
            onClick={() => {
              setSearchTerm('');
              setSelectedStatus('all'); // Changed from setSelectedStage to setSelectedStatus
              setSelectedPriority('all'); // Added priority reset
              dispatch(clearFilters());
            }}
          >
            {t('common.clearFilters', 'Clear Filters')}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="alert alert--error">
            <p>{error}</p>
            <button onClick={() => dispatch(clearError())} className="alert__close">
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="sessions-loading">
            <div className="spinner"></div>
            <p>{t('common.loading', 'Loading...')}</p>
          </div>
        )}

        {/* Sessions List */}
        {!loading && (
          <div className="sessions-list">
            {filteredSessions.length === 0 ? (
              <div className="sessions-empty">
                <Calendar className="sessions-empty__icon" size={64} />
                <h3>{t('admin.sessions.noSessions', 'No sessions found')}</h3>
                <p>{t('admin.sessions.noSessionsDesc', 'Create your first session to get started.')}</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-card__header" onClick={() => toggleSessionExpansion(session.id)}>
                    <div className="session-card__main">
                      <div className="session-card__client">
                        <User className="session-card__client-icon" size={20} />
                        <div>
                          <h3 className="session-card__client-name">
                            {t('admin.sessions.clientStory', { clientName: session.client_name })}
                          </h3>
                          <p className="session-card__client-email">{session.client_email || session.preferences?.client_contact?.email}</p>
                          <p className="session-card__client-age">{t('admin.sessions.age')}: {session.client_age}</p>
                        </div>
                      </div>

                      <div className="session-card__meta">
                        <span className={getStatusClass(session.status)}>
                          {getTranslatedStatus(session.status)}
                        </span>

                        <span className={getPriorityClass(session.preferences?.priority_level || 'standard')}>
                          {getTranslatedPriority(session.preferences?.priority_level || 'standard')}
                        </span>

                        <div className="session-card__date">
                          <Clock size={16} />
                          <span>{formatDate(session.created_at)}</span>
                        </div>

                        <div className="session-card__stats">
                          <div className="session-card__stat">
                            <Users size={16} />
                            <span>{session.preferences?.primary_contact?.name || session.preferences?.family_contact_details?.primary_contact?.name || 'No contact'}</span>
                          </div>

                          <div className="session-card__stat">
                            <FileText size={16} />
                            <span>{session.totalInterviews || getSessionInterviews(session).length} {t('admin.sessions.interviews', 'interviews')}</span>
                          </div>

                          <div className="session-card__stat">
                            <FileText size={16} />
                            <span>{session.completionPercentage || 0}% {t('admin.sessions.storyComplete', 'complete')}</span>
                          </div>

                          <div className="session-card__stat">
                            <Users size={16} />
                            <span>{session.completedInterviews || 0}/{session.totalInterviews || getSessionInterviews(session).length} {t('admin.sessions.completed', 'completed')}</span>
                          </div>

                          {(session.preferences?.accessibility_needs || session.preferences?.special_requirements) && (
                            <div className="session-card__stat session-card__stat--accessibility">
                              <AlertCircle size={16} />
                              <span>{t('admin.sessions.hasAccessibilityNeeds', 'Special needs')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="session-card__actions">
                      <button className="session-card__expand">
                        {expandedSessions[session.id] ?
                          <ChevronUp size={20} /> :
                          <ChevronDown size={20} />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedSessions[session.id] && (
                    <div className="session-card__details">

                      {/* Client Information */}
                      <div className="session-details__section">
                        <h4>{t('admin.sessions.clientInfo', 'Client Information')}</h4>
                        <div className="client-info">
                          <div className="client-info__item">
                            <strong>{t('admin.sessions.language', 'Language')}:</strong> {session.preferences?.preferred_language}
                          </div>
                          <div className="client-info__item">
                            <strong>{t('admin.sessions.specialRequirements', 'Special Requirements')}:</strong> {session.preferences?.special_requirements || t('common.none', 'None')}
                          </div>
                          <div className="client-info__item">
                            <strong>{t('admin.sessions.focusAreas', 'Focus Areas')}:</strong> {session.preferences?.story_preferences?.focus_areas?.join(', ') || t('common.none', 'None')}
                          </div>
                          <div className="client-info__item">
                            <strong>{t('admin.sessions.tonePreference', 'Tone Preference')}:</strong> {session.preferences?.story_preferences?.tone_preference || t('common.notSet', 'Not set')}
                          </div>
                        </div>
                      </div>

                      {/* Interviews */}
                      <div className="session-details__section">
                        <div className="session-details__section-header">
                          <h4>{t('admin.sessions.interviews', 'Interviews')}</h4>
                          <button
                            className="btn btn--secondary btn--sm"
                            onClick={() => handleShowScheduling(session.id)}
                          >
                            <Calendar size={16} />
                            {session.preferences?.interview_scheduling?.enabled ?
                              t('admin.sessions.viewSchedule', 'View Schedule') :
                              t('admin.sessions.setSchedule', 'Set Schedule')
                            }
                          </button>
                        </div>

                        <div className="session-interviews">
                          {getSessionInterviews(session).map((interview) => (
                            <div key={interview.id} className="interview">
                              <div className="interview__header">
                                <div className="interview__info">
                                  {editingInterview?.sessionId === session.id && editingInterview?.interviewId === interview.id ? (
                                    <div className="interview__edit">
                                      <div className="interview__edit-form">
                                        <input
                                          type="text"
                                          value={editInterviewName}
                                          onChange={(e) => setEditInterviewName(e.target.value)}
                                          className="interview__name-input"
                                          onKeyPress={(e) => e.key === 'Enter' && handleSaveInterviewName()}
                                          placeholder={t('admin.sessions.interviewNamePlaceholder', 'Interview name')}
                                          autoFocus
                                        />
                                        <label className="interview__friend-checkbox">
                                          <input
                                            type="checkbox"
                                            checked={editInterviewIsFriend}
                                            onChange={(e) => setEditInterviewIsFriend(e.target.checked)}
                                          />
                                          <span className="interview__friend-label">
                                            <Users size={14} />
                                            {t('admin.sessions.friendInterview', 'Friend Interview')}
                                          </span>
                                        </label>
                                      </div>
                                      <div className="interview__edit-actions">
                                        <button
                                          className="btn btn--primary btn--xs"
                                          onClick={handleSaveInterviewName}
                                        >
                                          {t('common.save', 'Save')}
                                        </button>
                                        <button
                                          className="btn btn--secondary btn--xs"
                                          onClick={handleCancelEditInterview}
                                        >
                                          {t('common.cancel', 'Cancel')}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="interview__name-container">
                                        <span className="interview__name">
                                          {interview.content?.name || interview.name || interview.notes || `Interview ${interview.id}`}
                                        </span>
                                        {(interview.content?.isFriendInterview || interview.isFriendInterview) && (
                                          <span className="interview__friend-badge">
                                            <Users size={12} />
                                            {t('admin.sessions.friendInterview', 'Friend')}
                                          </span>
                                        )}
                                      </div>
                                      <span className={`interview__status interview__status--${interview.status}`}>
                                        {t(`admin.sessions.status.${interview.status}`, interview.status)}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="interview__actions">
                                  {!(interview.file_upload || interview.content?.file_upload) && (
                                    <button
                                      className="btn btn--secondary btn--xs"
                                      onClick={() => handleShowFileUpload(interview.id)}
                                    >
                                      <Upload size={12} />
                                      {t('admin.sessions.uploadFile', 'Upload File')}
                                    </button>
                                  )}
                                  <button
                                    className="btn btn--secondary btn--xs"
                                    onClick={() => handleEditInterview(session.id, interview)}
                                  >
                                    <Edit size={12} />
                                    {t('common.edit', 'Edit')}
                                  </button>
                                  <button
                                    className="btn btn--secondary btn--xs"
                                    onClick={() => handleDeleteInterview(session.id, interview.id)}
                                  >
                                    <Trash size={12} />
                                    {t('common.delete', 'Delete')}
                                  </button>
                                </div>
                              </div>
                              <div className="interview__details">
                                <div className="interview__meta">
                                  <Clock size={14} />
                                  <span>{interview.duration} {t('admin.sessions.minutes', 'min')}</span>
                                </div>
                                {interview.wordCount && <div className="interview__meta">
                                  <FileText size={14} />
                                  <span>{interview.wordCount} {t('admin.sessions.words', 'words')}</span>
                                </div>}
                                {(interview.file_upload || interview.content?.file_upload) && (
                                  <div className="interview__meta">
                                    <FileText size={14} />
                                    <button
                                      className="interview__file-link"
                                      onClick={() => handleShowFileView(interview)}
                                      title={t('admin.sessions.viewFile', 'View uploaded file')}
                                    >
                                      {t('admin.sessions.fileUploaded', 'File uploaded')}
                                    </button>
                                  </div>
                                )}
                                {(interview.ai_draft || interview.content?.ai_draft) && (
                                  <div className="interview__meta">
                                    <FileText size={14} />
                                    <button
                                      className="interview__file-link"
                                      onClick={() => handleShowDraftView(interview)}
                                      title={t('admin.sessions.viewDraft', 'View AI draft')}
                                    >
                                      {t('admin.sessions.draftGenerated', 'Draft generated')}
                                    </button>
                                  </div>
                                )}
                              </div>
                              {interview.notes && (
                                <p className="interview__notes">{interview.notes}</p>
                              )}
                            </div>
                          ))}

                          {/* Add Interview Button */}
                          <div className="interview interview--add">
                            <button
                              className="btn btn--secondary btn--sm interview__add-btn"
                              onClick={() => handleAddInterview(session.id)}
                            >
                              <Plus size={16} />
                              {t('admin.sessions.addInterview', 'Add Interview')}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="session-details__section">
                        <h4>{t('admin.sessions.metadata', 'Session Info')}</h4>
                        <div className="session-metadata">
                          <div className="metadata-item">
                            <span className="metadata-item__label">{t('admin.sessions.totalDuration', 'Total Duration')}:</span>
                            <span className="metadata-item__value">
                              {(() => {
                                const totalMinutes = session.totalDuration || 0;
                                if (totalMinutes === 0) return 'N/A';
                                
                                const hours = Math.floor(totalMinutes / 60);
                                const minutes = totalMinutes % 60;
                                
                                if (hours === 0) {
                                  return `${minutes} min`;
                                } else if (minutes === 0) {
                                  return `${hours}h`;
                                } else {
                                  return `${hours}h ${minutes}min`;
                                }
                              })()}
                            </span>
                          </div>
                          <div className="metadata-item">
                            <span className="metadata-item__label">{t('admin.sessions.storyComplete', 'Story Complete')}:</span>
                            <span className="metadata-item__value">
                              {session.completionPercentage || 0}%
                            </span>
                          </div>
                          {session.preferences?.metadata?.cqsScore && (
                            <div className="metadata-item">
                              <span className="metadata-item__label">{t('admin.sessions.cqsScore', 'CQS Score')}:</span>
                              <span>{session.preferences?.metadata?.cqsScore}/10</span>
                            </div>
                          )}
                          <div className="metadata-item">
                            <span className="metadata-item__label">{t('admin.sessions.tPriority', 'Priority')}:</span>
                            <span className={`metadata-item__value priority priority--${session.preferences?.priority_level || 'standard'}`}>
                              {t(`admin.sessions.priorities.${session.preferences?.priority_level || 'standard'}`, session.preferences?.priority_level || 'standard')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="session-details__actions">
                        <button 
                          className="btn btn--primary btn--sm"
                          onClick={() => navigate(`/admin/drafts/${session.id}`)}
                        >
                          <Eye size={16} />
                          {t('admin.sessions.viewDrafts', 'View Drafts')}
                        </button>
                        <button className="btn btn--secondary btn--sm">
                          <Edit size={16} />
                          {t('common.edit', 'Edit')}
                        </button>
                        <button 
                          className="btn btn--info btn--sm"
                          onClick={() => setShowMigrationPanel(session)}
                        >
                          <Database size={16} />
                          Migration
                        </button>
                        <button className="btn btn--danger btn--sm" onClick={() => handleDeleteSession(session.id)}>
                          <Trash2 size={16} />
                          {t('common.delete', 'Delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredSessions.length > 0 && (
          <div className="sessions-pagination">
            <div className="pagination-info">
              <span>
                {t('admin.sessions.showing', 'Showing')} {Math.min(1, filteredSessions.length)}-
                {Math.min(filteredSessions.length, pagination.limit)}
                {' '}{t('admin.sessions.of', 'of')} {filteredSessions.length} {t('admin.sessions.sessions', 'life stories')}
              </span>
            </div>

            <div className="pagination-controls">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                {t('common.previous', 'Previous')}
              </button>

              <span className="pagination-current">
                {t('common.page', 'Page')} {pagination.currentPage} {t('common.of', 'of')} {pagination.totalPages}
              </span>

              <button
                className="btn btn--secondary btn--sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                {t('common.next', 'Next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Scheduling Modal */}
      {showSchedulingModal && (
        <div className="modal-overlay" onClick={handleCloseScheduling}>
          <div className="modal modal--medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{t('admin.sessions.interviewScheduling', 'Interview Scheduling')}</h3>
              <button className="modal__close" onClick={handleCloseScheduling}>
                <X size={20} />
              </button>
            </div>
            <div className="modal__content">
              {(() => {
                const session = sessions.find(s => s.id === showSchedulingModal);
                if (!session) return null;

                return (
                  <div className="scheduling-info">
                    <div className="schedule-form">
                      <h4>{session.interview_scheduling?.enabled ?
                        t('admin.sessions.editSchedule', 'Edit Schedule') :
                        t('admin.sessions.setSchedule', 'Set Schedule')
                      }</h4>

                      <div className="schedule-form__grid">
                        <div className="form-group">
                          <label className="form-group__label">
                            {t('admin.sessions.dayOfWeek', 'Day of Week')} *
                          </label>
                          <select
                            value={scheduleForm.dayOfWeek}
                            onChange={(e) => handleScheduleFormChange('dayOfWeek', e.target.value)}
                            className="form-group__select"
                            required
                          >
                            <option value="">{t('admin.sessions.selectDay', 'Select day')}</option>
                            <option value="sunday">{t('admin.sessions.days.sunday', 'Sunday')}</option>
                            <option value="monday">{t('admin.sessions.days.monday', 'Monday')}</option>
                            <option value="tuesday">{t('admin.sessions.days.tuesday', 'Tuesday')}</option>
                            <option value="wednesday">{t('admin.sessions.days.wednesday', 'Wednesday')}</option>
                            <option value="thursday">{t('admin.sessions.days.thursday', 'Thursday')}</option>
                            <option value="friday">{t('admin.sessions.days.friday', 'Friday')}</option>
                            <option value="saturday">{t('admin.sessions.days.saturday', 'Saturday')}</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-group__label">
                            {t('admin.sessions.startTime', 'Start Time')} *
                          </label>
                          <input
                            type="time"
                            value={scheduleForm.startTime}
                            onChange={(e) => handleScheduleFormChange('startTime', e.target.value)}
                            className="form-group__input"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-group__label">
                            {t('admin.sessions.duration', 'Duration (minutes)')}
                          </label>
                          <select
                            value={scheduleForm.duration}
                            onChange={(e) => handleScheduleFormChange('duration', parseInt(e.target.value))}
                            className="form-group__select"
                          >
                            <option value={30}>30 {t('admin.sessions.minutes', 'minutes')}</option>
                            <option value={45}>45 {t('admin.sessions.minutes', 'minutes')}</option>
                            <option value={60}>60 {t('admin.sessions.minutes', 'minutes')}</option>
                            <option value={90}>90 {t('admin.sessions.minutes', 'minutes')}</option>
                            <option value={120}>120 {t('admin.sessions.minutes', 'minutes')}</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-group__label">
                            {t('admin.sessions.location', 'Location')}
                          </label>
                          <select
                            value={scheduleForm.location}
                            onChange={(e) => handleScheduleFormChange('location', e.target.value)}
                            className="form-group__select"
                          >
                            <option value="online">{t('admin.sessions.locations.online', 'Online')}</option>
                            <option value="office">{t('admin.sessions.locations.office', 'Office')}</option>
                            <option value="home">{t('admin.sessions.locations.home', 'Client Home')}</option>
                            <option value="phone">{t('admin.sessions.locations.phone', 'Phone')}</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group form-group--full">
                        <label className="form-group__label">
                          {t('admin.sessions.notes', 'Notes')}
                        </label>
                        <textarea
                          value={scheduleForm.notes}
                          onChange={(e) => handleScheduleFormChange('notes', e.target.value)}
                          className="form-group__textarea"
                          placeholder={t('admin.sessions.scheduleNotesPlaceholder', 'Additional scheduling notes...')}
                          rows={3}
                        />
                      </div>

                      <div className="schedule-form__actions">
                        <button
                          className="btn btn--primary"
                          onClick={handleSaveSchedule}
                        >
                          {session.interview_scheduling?.enabled ?
                            t('admin.sessions.updateSchedule', 'Update Schedule') :
                            t('admin.sessions.setSchedule', 'Set Schedule')
                          }
                        </button>
                        <button
                          className="btn btn--secondary"
                          onClick={handleCloseScheduling}
                        >
                          {t('common.cancel', 'Cancel')}
                        </button>
                      </div>
                    </div>

                    {session.interview_scheduling?.enabled && (
                      <div className="current-schedule">
                        <h5>{t('admin.sessions.currentSchedule', 'Current Schedule')}</h5>
                        <div className="schedule-details">
                          <div className="schedule-item">
                            <Calendar size={16} />
                            <span>{t(`admin.sessions.days.${session.interview_scheduling.day_of_week}`, session.interview_scheduling.day_of_week)}</span>
                          </div>
                          <div className="schedule-item">
                            <Clock size={16} />
                            <span>{session.interview_scheduling.start_time}</span>
                          </div>
                          <div className="schedule-item">
                            <span>{session.interview_scheduling.duration} {t('admin.sessions.minutes', 'minutes')}</span>
                          </div>
                          <div className="schedule-item">
                            <span>{t(`admin.sessions.locations.${session.interview_scheduling.location}`, session.interview_scheduling.location)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUploadModal && (
        <div className="modal-overlay" onClick={handleCloseFileUpload}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <FileUpload
              interviewId={showFileUploadModal}
              onClose={handleCloseFileUpload}
              onSuccess={handleFileUploadSuccess}
            />
          </div>
        </div>
      )}

      {/* File View Modal */}
      {showFileViewModal && (
        <div className="modal-overlay" onClick={handleCloseFileView}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{t('admin.sessions.fileDetails', 'File Details')}</h3>
              <button className="modal__close" onClick={handleCloseFileView}>
                <X size={20} />
              </button>
            </div>
            <div className="modal__content">
              <div className="file-details">
                <div className="file-details__info">
                  <h4>{t('admin.sessions.fileInfo', 'File Information')}</h4>
                  <div className="file-info-grid">
                    <div className="file-info-item">
                      <strong>{t('admin.sessions.fileName', 'File Name')}:</strong>
                      <span>{showFileViewModal.file_upload?.originalName || showFileViewModal.file_upload?.fileName}</span>
                    </div>
                    <div className="file-info-item">
                      <strong>{t('admin.sessions.fileSize', 'File Size')}:</strong>
                      <span>{showFileViewModal.file_upload?.fileSize ? `${(showFileViewModal.file_upload.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'}</span>
                    </div>
                    <div className="file-info-item">
                      <strong>{t('admin.sessions.fileType', 'File Type')}:</strong>
                      <span>{showFileViewModal.file_upload?.mimeType}</span>
                    </div>
                    <div className="file-info-item">
                      <strong>{t('admin.sessions.uploadedAt', 'Uploaded At')}:</strong>
                      <span>{showFileViewModal.file_upload?.uploadedAt ? new Date(showFileViewModal.file_upload.uploadedAt).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
                {showFileViewModal.transcription && (
                  <div className="file-details__transcription">
                    <h4>{t('admin.sessions.transcription', 'Transcription')}</h4>
                    <div className="transcription-content">
                      <pre>{showFileViewModal.transcription}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Draft View Modal */}
      {showDraftViewModal && (
        <div className="modal-overlay" onClick={handleCloseDraftView}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3>{t('admin.sessions.draftDetails', 'Draft Details')}</h3>
              <button className="modal__close" onClick={handleCloseDraftView}>
                <X size={20} />
              </button>
            </div>
            <div className="modal__content">
              <div className="draft-details">
                <div className="draft-details__info">
                  <h4>{t('admin.sessions.draftInfo', 'Draft Information')}</h4>
                  <div className="draft-info-grid">
                    <div className="draft-info-item">
                      <strong>{t('admin.sessions.draftTitle', 'Title')}:</strong>
                      <span>{showDraftViewModal.ai_draft?.title}</span>
                    </div>
                    <div className="draft-info-item">
                      <strong>{t('admin.sessions.draftStatus', 'Status')}:</strong>
                      <span>{showDraftViewModal.ai_draft?.status}</span>
                    </div>
                    <div className="draft-info-item">
                      <strong>{t('admin.sessions.draftVersion', 'Version')}:</strong>
                      <span>{showDraftViewModal.ai_draft?.version}</span>
                    </div>
                    <div className="draft-info-item">
                      <strong>{t('admin.sessions.createdAt', 'Created At')}:</strong>
                      <span>{showDraftViewModal.ai_draft?.createdAt ? new Date(showDraftViewModal.ai_draft.createdAt).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
                {showDraftViewModal.ai_draft?.content && (
                  <div className="draft-details__content">
                    <h4>{t('admin.sessions.draftContent', 'Content')}</h4>
                    <div className="draft-content">
                      {showDraftViewModal.ai_draft.content.summary && (
                        <div className="draft-section">
                          <h5>{t('admin.sessions.summary', 'Summary')}</h5>
                          <p>{showDraftViewModal.ai_draft.content.summary}</p>
                        </div>
                      )}
                      {showDraftViewModal.ai_draft.content.sections && Array.isArray(showDraftViewModal.ai_draft.content.sections) && (
                        <div className="draft-section">
                          <h5>{t('admin.sessions.sections', 'Sections')}</h5>
                          {showDraftViewModal.ai_draft.content.sections.map((section, index) => (
                            <div key={index} className="draft-subsection">
                              <h6>{section.title}</h6>
                              <p>{section.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {showDraftViewModal.ai_draft.content.keyThemes && Array.isArray(showDraftViewModal.ai_draft.content.keyThemes) && (
                        <div className="draft-section">
                          <h5>{t('admin.sessions.keyThemes', 'Key Themes')}</h5>
                          <ul>
                            {showDraftViewModal.ai_draft.content.keyThemes.map((theme, index) => (
                              <li key={index}>{theme}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Migration Panel Modal */}
      {showMigrationPanel && (
        <div className="modal-overlay" onClick={() => setShowMigrationPanel(null)}>
          <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.sessions.migration.title', 'Interview Migration')}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowMigrationPanel(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <MigrationPanel sessionId={showMigrationPanel.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;
