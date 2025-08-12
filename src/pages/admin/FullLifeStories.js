import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  BookOpen, 
  User, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  StickyNote,
  ChevronUp,
  ChevronRight,
  Hash,
  Clock,
  Eye,
  MessageSquare,
  Save
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const FullLifeStories = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // State management
  const [lifeStories, setLifeStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedStory, setExpandedStory] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  // Load life stories on component mount
  useEffect(() => {
    fetchLifeStories();
  }, []);

  const fetchLifeStories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/full-life-stories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch life stories');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match our frontend structure
        const transformedStories = data.data.map(story => {
          // Check if this story is actually rejected (stored in review_notes)
          const isRejected = story.review_notes && story.review_notes.includes('Rejected -');
          const actualStatus = isRejected ? 'rejected' : story.status;
          
          return {
            id: story.id,
            title: story.title || `${story.sessions?.client_name || 'Untitled'} - Life Story`,
            subtitle: story.subtitle,
            sessionId: story.session_id,
            participantName: story.sessions?.client_name || 'Unknown',
            clientAge: story.sessions?.client_age || null,
            status: actualStatus, // Use the detected status (rejected or original)
            version: story.version,
            isCurrentVersion: story.is_current_version,
          createdAt: story.generated_at || story.created_at,
          updatedAt: story.updated_at,
          generatedBy: story.generated_by,
          aiModel: story.ai_model,
          wordCount: story.total_words || 0,
          totalPages: story.total_pages || 0,
          estimatedReadingTime: story.estimated_reading_time || 0,
          chapterCount: story.content?.chapters?.length || 0,
          processingTime: story.processing_time || 0,
          content: {
            summary: story.content?.summary || story.content?.introduction?.summary || story.subtitle || '',
            chapters: story.content?.chapters || [],
            keyMoments: story.content?.key_moments || story.content?.keyMoments || [],
            timeline: story.content?.timeline || [],
            introduction: story.content?.introduction || null,
            appendices: story.content?.appendices || null
          },
          generationStats: story.generation_stats || {},
          sourceMetadata: story.source_metadata || {},
          // Parse notes from review_notes field (format: [timestamp] author: text)
          notes: story.review_notes ? story.review_notes.split('\n\n').map((noteText, index) => {
            const match = noteText.match(/^\[([^\]]+)\]\s*([^:]+):\s*(.+)$/s);
            if (match) {
              return {
                id: index + 1,
                text: match[3].trim(),
                createdAt: match[1],
                author: match[2].trim()
              };
            } else {
              // Fallback for notes without proper format
              return {
                id: index + 1,
                text: noteText.trim(),
                createdAt: story.reviewed_at,
                author: story.reviewed_by || 'Unknown'
              };
            }
          }).filter(note => note.text) : [],
            reviewedAt: story.reviewed_at,
            reviewedBy: story.reviewed_by,
            approvalMetadata: story.status === 'approved' ? {
              approvedBy: story.reviewed_by,
              approvedAt: story.reviewed_at,
              reason: story.review_notes
            } : null,
            rejectionMetadata: isRejected ? {
              rejectedBy: story.reviewed_by,
              rejectedAt: story.reviewed_at,
              reason: story.review_notes
            } : null
          };
        });
        
        setLifeStories(transformedStories);
      } else {
        throw new Error(data.error || 'Failed to fetch life stories');
      }
    } catch (err) {
      console.error('Error fetching life stories:', err);
      setError(err.message);
      // Set empty array on error instead of mock data
      setLifeStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort life stories
  const filteredAndSortedStories = useMemo(() => {
    let filtered = lifeStories;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(story =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.participantName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(story => story.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [lifeStories, searchQuery, statusFilter, sortBy, sortOrder]);

  // Handle actions
  const handleApprove = async (storyId) => {
    setActionLoading(prev => ({ ...prev, [storyId]: 'approving' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/full-life-stories/${storyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'approved',
          reason: 'Approved for publication'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to approve life story');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the life stories list
        await fetchLifeStories();
      } else {
        throw new Error(data.error || 'Failed to approve life story');
      }
    } catch (err) {
      console.error('Error approving life story:', err);
      setError('Failed to approve life story');
    } finally {
      setActionLoading(prev => ({ ...prev, [storyId]: null }));
    }
  };

  const handleReject = async (storyId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason || !reason.trim()) {
      return; // User cancelled or didn't provide a reason
    }

    setActionLoading(prev => ({ ...prev, [storyId]: 'rejecting' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/full-life-stories/${storyId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'rejected',
          reason: reason.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reject life story');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the life stories list
        await fetchLifeStories();
      } else {
        throw new Error(data.error || 'Failed to reject life story');
      }
    } catch (err) {
      console.error('Error rejecting life story:', err);
      setError('Failed to reject life story');
    } finally {
      setActionLoading(prev => ({ ...prev, [storyId]: null }));
    }
  };

  const handleRegenerate = async (storyId) => {
    setActionLoading(prev => ({ ...prev, [storyId]: 'regenerating' }));
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/full-life-stories/${storyId}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate life story');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh the life stories list
        await fetchLifeStories();
      } else {
        throw new Error(data.error || 'Failed to regenerate life story');
      }
    } catch (err) {
      console.error('Error regenerating life story:', err);
      setError('Failed to regenerate life story');
    } finally {
      setActionLoading(prev => ({ ...prev, [storyId]: null }));
    }
  };

  // Check if regenerate should be available (only if there are notes added after generation)
  const shouldShowRegenerate = (story) => {
    if (story.status === 'approved' || story.status === 'rejected') {
      return false; // Don't allow regenerate for finalized stories
    }
    
    if (!story.notes || story.notes.length === 0) {
      return false; // No notes, no need to regenerate
    }

    // Check if any notes were added after the story was generated
    const storyGeneratedAt = new Date(story.createdAt);
    const hasNewNotes = story.notes.some(note => {
      const noteCreatedAt = new Date(note.createdAt);
      return noteCreatedAt > storyGeneratedAt;
    });

    return hasNewNotes;
  };

  const handleAddNote = async (storyId) => {
    if (!notesText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/full-life-stories/${storyId}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: notesText.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add the new note to the local state
        const newNote = data.data.note;
        setLifeStories(prev => prev.map(story =>
          story.id === storyId
            ? {
                ...story,
                notes: [...story.notes, newNote]
              }
            : story
        ));

        setNotesText('');
        setEditingNotes(null);
      } else {
        throw new Error(data.error || 'Failed to add note');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_approval: { color: 'warning', icon: Clock, text: t('admin.lifeStories.status.pendingApproval', 'Pending Approval') },
      approved: { color: 'success', icon: CheckCircle, text: t('admin.lifeStories.status.approved', 'Approved') },
      rejected: { color: 'danger', icon: XCircle, text: t('admin.lifeStories.status.rejected', 'Rejected') },
      regenerating: { color: 'info', icon: RefreshCw, text: t('admin.lifeStories.status.regenerating', 'Regenerating') }
    };

    const config = statusConfig[status] || statusConfig.pending_approval;
    const Icon = config.icon;

    return (
      <span className={`status-badge status-badge--${config.color}`}>
        <Icon size={12} />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page__content">
          <div className="loading-container">
            <LoadingSpinner size="large" />
            <p>{t('common.loading', 'Loading...')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page full-life-stories-page">
      <header className="admin-page__header">
        <div className="admin-page__header-content">
          <div className="admin-page__title-section">
            <h1 className="admin-page__title">
              <BookOpen size={24} />
              {t('admin.lifeStories.title', 'Full Life Stories')}
            </h1>
            <p className="admin-page__subtitle">
              {t('admin.lifeStories.subtitle', 'Manage and review complete life story narratives')}
            </p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="admin-page__toolbar">
          <div className="search-bar">
            <div className="search-bar__input">
              <Search className="search-bar__icon" size={20} />
              <input
                type="text"
                placeholder={t('admin.lifeStories.searchPlaceholder', 'Search by name or title...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-bar__field"
              />
            </div>
          </div>

          <div className="toolbar-actions">
            <button 
              className={`btn btn--secondary ${showFilters ? 'btn--active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              {t('common.filters', 'Filters')}
              <ChevronDown 
                size={16} 
                className={`chevron ${showFilters ? 'chevron--up' : ''}`} 
              />
            </button>
          </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filters-panel__content">
              <div className="filter-group">
                <label className="filter-label">{t('common.status', 'Status')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t('common.all', 'All')}</option>
                  <option value="generated">{t('admin.lifeStories.status.generated', 'Generated')}</option>
                  <option value="approved">{t('admin.lifeStories.status.approved', 'Approved')}</option>
                  <option value="rejected">{t('admin.lifeStories.status.rejected', 'Rejected')}</option>
                  <option value="archived">{t('admin.lifeStories.status.archived', 'Archived')}</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">{t('common.sortBy', 'Sort By')}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="createdAt">{t('common.dateCreated', 'Date Created')}</option>
                  <option value="updatedAt">{t('common.dateUpdated', 'Date Updated')}</option>
                  <option value="participantName">{t('admin.lifeStories.participantName', 'Participant Name')}</option>
                  <option value="wordCount">{t('admin.lifeStories.wordCount', 'Word Count')}</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">{t('common.order', 'Order')}</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="filter-select"
                >
                  <option value="desc">{t('common.descending', 'Descending')}</option>
                  <option value="asc">{t('common.ascending', 'Ascending')}</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="admin-page__content">
        {error && (
          <ErrorAlert 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__value">{lifeStories.length}</div>
            <div className="stat-card__label">{t('admin.lifeStories.totalStories', 'Total Stories')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{lifeStories.filter(s => s.status === 'generated').length}</div>
            <div className="stat-card__label">{t('admin.lifeStories.generated', 'Generated')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">{lifeStories.filter(s => s.status === 'approved').length}</div>
            <div className="stat-card__label">{t('admin.lifeStories.approved', 'Approved')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__value">
              {Math.round(lifeStories.reduce((sum, story) => sum + story.wordCount, 0) / lifeStories.length) || 0}
            </div>
            <div className="stat-card__label">{t('admin.lifeStories.avgWordCount', 'Avg Word Count')}</div>
          </div>
        </div>

        {/* Life Stories List */}
        <div className="life-stories-list">
          {filteredAndSortedStories.length === 0 ? (
            <div className="empty-state">
              <BookOpen className="empty-state__icon" size={64} />
              <h3 className="empty-state__title">{t('admin.lifeStories.noStories', 'No Life Stories Found')}</h3>
              <p className="empty-state__description">
                {t('admin.lifeStories.noStoriesDesc', 'Life stories will appear here once they are generated from approved drafts.')}
              </p>
            </div>
          ) : (
            filteredAndSortedStories.map(story => (
              <div key={story.id} className="life-story-card">
                <div className="life-story-card__header">
                  <div className="life-story-card__info">
                    <h3 className="life-story-card__title">{story.title}</h3>
                    <div className="life-story-card__meta">
                      <span className="meta-item">
                        <User size={14} />
                        {story.participantName} {story.clientAge && `(${story.clientAge})`}
                      </span>
                      <span className="meta-item">
                        <Calendar size={14} />
                        {formatDate(story.createdAt)}
                      </span>
                      <span className="meta-item">
                        <BookOpen size={14} />
                        {story.wordCount.toLocaleString()} words, {story.chapterCount} chapters
                      </span>
                      <span className="meta-item">
                        <Hash size={14} />
                        v{story.version} {story.isCurrentVersion && '(current)'}
                      </span>
                      {story.estimatedReadingTime > 0 && (
                        <span className="meta-item">
                          <Clock size={14} />
                          {story.estimatedReadingTime} min read
                        </span>
                      )}
                      {story.generatedBy && (
                        <span className="meta-item">
                          <User size={14} />
                          Generated by: {story.generatedBy}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="life-story-card__status">
                    {getStatusBadge(story.status)}
                  </div>
                </div>

                <div className="life-story-card__content">
                  <p className="life-story-card__summary">{story.content.summary}</p>
                  
                  {story.content.keyMoments && story.content.keyMoments.length > 0 && (
                    <div className="key-moments">
                      <strong>{t('admin.lifeStories.keyMoments', 'Key Moments')}: </strong>
                      {story.content.keyMoments.join(', ')}
                    </div>
                  )}
                </div>

                <div className="life-story-card__actions">
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}
                  >
                    <Eye size={16} />
                    {expandedStory === story.id ? t('common.hide', 'Hide') : t('common.view', 'View')}
                    {expandedStory === story.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {story.status === 'generated' && (
                    <>
                      <button
                        className="btn btn--success btn--sm"
                        onClick={() => handleApprove(story.id)}
                        disabled={actionLoading[story.id] === 'approving'}
                      >
                        {actionLoading[story.id] === 'approving' ? (
                          <RefreshCw size={16} className="spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        {t('common.approve', 'Approve')}
                      </button>

                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => handleReject(story.id)}
                        disabled={actionLoading[story.id] === 'rejecting'}
                      >
                        {actionLoading[story.id] === 'rejecting' ? (
                          <RefreshCw size={16} className="spin" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        {t('common.reject', 'Reject')}
                      </button>
                    </>
                  )}

                  {shouldShowRegenerate(story) && (
                    <button
                      className="btn btn--warning btn--sm"
                      onClick={() => handleRegenerate(story.id)}
                      disabled={actionLoading[story.id] === 'regenerating'}
                    >
                      {actionLoading[story.id] === 'regenerating' ? (
                        <RefreshCw size={16} className="spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      {t('admin.lifeStories.regenerate', 'Regenerate')}
                    </button>
                  )}

                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => setEditingNotes(editingNotes === story.id ? null : story.id)}
                  >
                    <StickyNote size={16} />
                    {t('admin.lifeStories.notes', 'Notes')} ({story.notes.length})
                  </button>
                </div>

                {/* Expanded Content */}
                {expandedStory === story.id && (
                  <div className="life-story-card__expanded">
                    <div className="expanded-content">
                      <h4>{t('admin.lifeStories.chapters', 'Chapters')}</h4>
                      {story.content.chapters.map((chapter, index) => (
                        <div key={index} className="chapter-preview">
                          <h5>{chapter.title}</h5>
                          <p>{chapter.content.substring(0, 200)}...</p>
                        </div>
                      ))}

                      {story.content.timeline && story.content.timeline.length > 0 && (
                        <div className="timeline-preview">
                          <h4>{t('admin.lifeStories.timeline', 'Timeline')}</h4>
                          <div className="timeline-items">
                            {story.content.timeline.map((item, index) => (
                              <div key={index} className="timeline-item">
                                <strong>{item.year}</strong>: {item.event}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {editingNotes === story.id && (
                  <div className="life-story-card__notes">
                    <div className="notes-section">
                      <h4>{t('admin.lifeStories.notes', 'Notes')}</h4>
                      
                      {story.notes.length > 0 && (
                        <div className="existing-notes">
                          {story.notes.map(note => (
                            <div key={note.id} className="note-item">
                              <div className="note-content">{note.text}</div>
                              <div className="note-meta">
                                {note.author} - {formatDate(note.createdAt)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="add-note">
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          placeholder={t('admin.lifeStories.addNotePlaceholder', 'Add a note about this life story...')}
                          className="note-textarea"
                          rows={3}
                        />
                        <div className="note-actions">
                          <button
                            className="btn btn--primary btn--sm"
                            onClick={() => handleAddNote(story.id)}
                            disabled={!notesText.trim()}
                          >
                            <Save size={16} />
                            {t('admin.lifeStories.addNote', 'Add Note')}
                          </button>
                          <button
                            className="btn btn--secondary btn--sm"
                            onClick={() => {
                              setEditingNotes(null);
                              setNotesText('');
                            }}
                          >
                            {t('common.cancel', 'Cancel')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FullLifeStories;
