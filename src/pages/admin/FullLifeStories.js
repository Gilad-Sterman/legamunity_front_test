import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
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
  Hash,
  Clock,
  Eye,
  Save
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const FullLifeStories = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  
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
  const [regenerationProcessing, setRegenerationProcessing] = useState(null);
  const [regenerationStep, setRegenerationStep] = useState(0);

  // Load life stories on component mount
  useEffect(() => {
    fetchLifeStories();
  }, []);

  // Handle URL parameters for story highlighting
  useEffect(() => {
    const storyId = searchParams.get('storyId');
    const sessionId = searchParams.get('sessionId');
    
    if (storyId && lifeStories.length > 0) {
      // Find the story by ID
      const targetStory = lifeStories.find(story => story.id === storyId);
      
      if (targetStory) {
        // Expand the story automatically
        setExpandedStory(storyId);
        
        // Scroll to the story after a short delay to ensure DOM is ready
        setTimeout(() => {
          const storyElement = document.querySelector(`[data-story-id="${storyId}"]`);
          if (storyElement) {
            // Scroll with offset to keep header visible
            storyElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
            // Add offset to account for header height
            window.scrollBy(0, -100);
            // Add a highlight effect
            storyElement.classList.add('story-highlighted');
            setTimeout(() => {
              storyElement.classList.remove('story-highlighted');
            }, 5000);
          }
        }, 100);
        
        // Clear the URL parameters after handling them
        setSearchParams({});
      }
    }
  }, [lifeStories, searchParams, setSearchParams]);

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
          
          // Handle both old structured format and new string format
          const isNewFormat = typeof story.content === 'string';
          const contentData = isNewFormat ? {} : story.content || {};
          
          // Extract word count from metadata or calculate from content
          const wordCount = story.total_words || 
                           story.metadata?.wordCount || 
                           (isNewFormat && story.content ? story.content.split(/\s+/).length : 0) || 
                           0;
          
          // Extract chapters from markdown headers if new format
          const extractChaptersFromMarkdown = (text) => {
            if (!text || typeof text !== 'string') return [];
            const headerMatches = text.match(/^##\s+(.+)$/gm);
            return headerMatches ? headerMatches.map(match => ({ title: match.replace(/^##\s+/, '') })) : [];
          };
          
          // Extract summary from first paragraph if new format
          const extractSummaryFromMarkdown = (text) => {
            if (!text || typeof text !== 'string') return '';
            const paragraphs = text.split('\n\n').filter(p => p.trim() && !p.startsWith('#'));
            return paragraphs[0] ? paragraphs[0].substring(0, 200) + '...' : '';
          };
          
          return {
            id: story.id,
            title: (() => {
              // Try to extract title from content.fullText first line if it's a markdown header
              if (story.content?.fullText) {
                const firstLine = story.content.fullText.split('\n')[0].trim();
                if (firstLine.startsWith('# ')) {
                  return firstLine.substring(2).trim();
                }
              }
              // Fallback to story.title if available and not generic
              if (story.title && story.title !== 'Generated Life Story') {
                return story.title;
              }
              // Final fallback
              return `${story.sessions?.client_name || 'Untitled'} - Life Story`;
            })(),
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
          wordCount: wordCount,
          totalPages: story.total_pages || Math.ceil(wordCount / 250) || 0, // Estimate pages
          estimatedReadingTime: story.estimated_reading_time || Math.ceil(wordCount / 200) || 0, // Estimate reading time
          chapterCount: isNewFormat ? extractChaptersFromMarkdown(story.content).length : (contentData.chapters?.length || 0),
          processingTime: story.processing_time || story.metadata?.processingTime || 0,
          // Session statistics for indicators - get from sourceMetadata
          sessionStats: {
            totalInterviews: story.source_metadata?.totalInterviews || story.sourceMetadata?.totalInterviews || 0,
            completedInterviews: story.source_metadata?.totalInterviews || story.sourceMetadata?.totalInterviews || 0,
            totalDrafts: story.source_metadata?.approvedDrafts || story.sourceMetadata?.approvedDrafts || 0,
            approvedDrafts: story.source_metadata?.approvedDrafts || story.sourceMetadata?.approvedDrafts || 0
          },
          content: {
            // For new format (string content), extract structured data
            summary: isNewFormat ? extractSummaryFromMarkdown(story.content) : (contentData.summary || contentData.introduction?.summary || story.subtitle || ''),
            chapters: isNewFormat ? extractChaptersFromMarkdown(story.content) : (contentData.chapters || []),
            keyMoments: isNewFormat ? [] : (contentData.key_moments || contentData.keyMoments || []),
            timeline: isNewFormat ? [] : (contentData.timeline || []),
            introduction: isNewFormat ? null : (contentData.introduction || null),
            appendices: isNewFormat ? null : (contentData.appendices || null),
            // Keep the raw content for display
            fullText: isNewFormat ? story.content : (contentData.fullText || '')
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

  const handleRegenerate = async (storyId, regenerateNotes) => {
    // Start regeneration processing modal
    setRegenerationProcessing(storyId);
    setRegenerationStep(0);
    setActionLoading(prev => ({ ...prev, [storyId]: 'regenerating' }));
    
    try {
      // Simulate processing steps
      const steps = [
        { text: t('admin.lifeStories.regeneration.analyzingNotes', 'Analyzing notes and feedback...'), duration: 100 },
        { text: t('admin.lifeStories.regeneration.aiProcessing', 'AI processing and content generation...'), duration: 100 },
        { text: t('admin.lifeStories.regeneration.enhancingContent', 'Enhancing content structure...'), duration: 100 },
        { text: t('admin.lifeStories.regeneration.finalizingDraft', 'Finalizing new version...'), duration: 100 }
      ];

      // Process each step with delay
      for (let i = 0; i < steps.length; i++) {
        setRegenerationStep(i);
        await new Promise(resolve => setTimeout(resolve, steps[i].duration));
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/full-life-stories/${storyId}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          regenerationType: 'notes_based',
          includeAllNotes: true,
          notes: regenerateNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate life story');
      }

      const data = await response.json();
      
      if (data.success) {
        // Complete final step
        setRegenerationStep(steps.length - 1);
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
      setRegenerationProcessing(null);
      setRegenerationStep(0);
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
    
    // Filter out regeneration notes (notes that mention "Regenerated from version")
    const userNotes = story.notes.filter(note => 
      !note.text.includes('Regenerated from version')
    );
    
    if (userNotes.length === 0) {
      return false; // Only regeneration notes exist, no user feedback
    }
    
    // Check if any user notes were added after the story was generated
    const hasNewUserNotes = userNotes.some(note => {
      const noteCreatedAt = new Date(note.createdAt);
      return noteCreatedAt > storyGeneratedAt;
    });

    return hasNewUserNotes;
  };

  const getRegenerationSteps = () => [
    { text: t('admin.lifeStories.regeneration.analyzingNotes', 'Analyzing notes and feedback...'), icon: 'search' },
    { text: t('admin.lifeStories.regeneration.aiProcessing', 'AI processing and content generation...'), icon: 'brain' },
    { text: t('admin.lifeStories.regeneration.enhancingContent', 'Enhancing content structure...'), icon: 'edit' },
    { text: t('admin.lifeStories.regeneration.finalizingDraft', 'Finalizing new version...'), icon: 'check' }
  ];

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
              {t('admin.lifeStories.filters', 'Filters')}
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
                <label className="filter-label">{t('admin.lifeStories.status', 'Status')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">{t('common.all', 'All')}</option>
                  <option value="generated">{t('admin.lifeStories.statuss.generated', 'Generated')}</option>
                  <option value="approved">{t('admin.lifeStories.statuss.approved', 'Approved')}</option>
                  <option value="rejected">{t('admin.lifeStories.statuss.rejected', 'Rejected')}</option>
                  <option value="archived">{t('admin.lifeStories.statuss.archived', 'Archived')}</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">{t('admin.lifeStories.sortBy', 'Sort By')}</label>
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
              <div key={story.id} className="life-story-card" data-story-id={story.id}>
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
                    
                    {/* Session Statistics Indicators */}
                    <div className="life-story-card__indicators">
                      <div className="indicator-group">
                        <span className="indicator-label">{t('admin.sessions.lifeStories.interviews', 'Interviews')}:</span>
                        <span className="indicator-value">
                          {story.sessionStats.completedInterviews}/{story.sessionStats.totalInterviews}
                        </span>
                        <span className={`indicator-status ${
                          story.sessionStats.completedInterviews === story.sessionStats.totalInterviews ? 'complete' : 'incomplete'
                        }`}>
                          {story.sessionStats.completedInterviews === story.sessionStats.totalInterviews ? '✓' : '○'}
                        </span>
                      </div>
                      <div className="indicator-group">
                        <span className="indicator-label">{t('admin.sessions.lifeStories.drafts', 'Drafts')}:</span>
                        <span className="indicator-value">
                          {story.sessionStats.approvedDrafts}/{story.sessionStats.totalDrafts}
                        </span>
                        <span className={`indicator-status ${
                          story.sessionStats.approvedDrafts > 0 ? 'approved' : 'pending'
                        }`}>
                          {story.sessionStats.approvedDrafts > 0 ? '✓' : '○'}
                        </span>
                      </div>
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
                    {expandedStory === story.id ? t('admin.sessions.lifeStories.hide', 'Hide') : t('admin.sessions.lifeStories.view', 'View')}
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
                      onClick={() => handleRegenerate(story.id, story.notes)}
                      disabled={actionLoading[story.id] === 'regenerating'}
                    >
                      {actionLoading[story.id] === 'regenerating' ? (
                        <RefreshCw size={16} className="spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      {t('admin.sessions.lifeStories.regenerate', 'Regenerate')}
                    </button>
                  )}

                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => setEditingNotes(editingNotes === story.id ? null : story.id)}
                  >
                    <StickyNote size={16} />
                    {t('admin.sessions.lifeStories.notes', 'Notes')} ({story.notes.length})
                  </button>
                </div>

                {/* Expanded Content */}
                {expandedStory === story.id && (
                  <div className="life-story-card__expanded">
                    <div className="expanded-content">
                      {/* Show full text content for new format */}
                      {story.content.fullText && (
                        <div className="full-story-content">
                          <h4>{t('admin.lifeStories.fullStory', 'Full Life Story')}</h4>
                          <div className="story-text" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {story.content.fullText}
                          </div>
                        </div>
                      )}

                      {/* Show chapters for old format */}
                      {story.content.chapters && story.content.chapters.length > 0 && (
                        <div className="chapters-preview">
                          <h4>{t('admin.lifeStories.chapters', 'Chapters')}</h4>
                          {story.content.chapters.map((chapter, index) => (
                            <div key={index} className="chapter-preview">
                              <h5>{chapter.title}</h5>
                              {chapter.content && <p>{chapter.content.substring(0, 200)}...</p>}
                            </div>
                          ))}
                        </div>
                      )}

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

        {/* Regeneration Processing Modal */}
        {regenerationProcessing && (
          <div className="regeneration-processing-overlay">
            <div className="regeneration-processing-modal">
              <div className="regeneration-processing-content">
                <div className="regeneration-processing-header">
                  <RefreshCw className="regeneration-processing-icon spin" size={32} />
                  <h3>{t('admin.lifeStories.regeneration.title', 'Regenerating Life Story')}</h3>
                  <p>{t('admin.lifeStories.regeneration.subtitle', 'Creating new version with your feedback...')}</p>
                </div>

                <div className="regeneration-processing-steps">
                  {getRegenerationSteps().map((step, index) => {
                    const isActive = index === regenerationStep;
                    const isCompleted = index < regenerationStep;
                    const stepIcon = step.icon === 'search' ? Search : 
                                   step.icon === 'brain' ? RefreshCw : 
                                   step.icon === 'edit' ? StickyNote : CheckCircle;
                    const StepIcon = stepIcon;

                    return (
                      <div key={index} className={`regeneration-step ${
                        isActive ? 'regeneration-step--active' : 
                        isCompleted ? 'regeneration-step--completed' : 'regeneration-step--pending'
                      }`}>
                        <div className="regeneration-step-icon">
                          <StepIcon size={16} className={isActive ? 'spin' : ''} />
                        </div>
                        <div className="regeneration-step-content">
                          <span className="regeneration-step-text">{step.text}</span>
                          {isActive && (
                            <div className="regeneration-step-progress">
                              <div className="regeneration-progress-bar">
                                <div className="regeneration-progress-fill"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        {isCompleted && (
                          <div className="regeneration-step-check">
                            <CheckCircle size={14} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="regeneration-processing-footer">
                  <p className="regeneration-processing-note">
                    {t('admin.lifeStories.regeneration.note', 'This process may take a few minutes. Please do not close this window.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullLifeStories;
