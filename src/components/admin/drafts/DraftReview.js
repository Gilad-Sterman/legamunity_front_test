import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FileText, 
  User, 
  Calendar, 
  Clock, 
  Star, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Download, 
  History, 
  MessageSquare,
  Award,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Save,
  X
} from 'lucide-react';
import { 
  approveDraft, 
  rejectDraft, 
  updateDraftStage,
  fetchDraftHistory 
} from '../../../store/slices/draftsSlice';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const DraftReview = ({ draft, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.drafts);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showVersionCompare, setShowVersionCompare] = useState(false);
  const [showStageTransition, setShowStageTransition] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newStage, setNewStage] = useState('');
  const [stageTransitionReason, setStageTransitionReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    professional: true,
    technical: true,
    behavioral: true,
    interviews: false,
    progress: true,
    versions: false
  });
  const [draftHistory, setDraftHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [draftVersions, setDraftVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    action: 'all',
    dateRange: 'all',
    user: 'all'
  });

  useEffect(() => {
    if (activeTab === 'history') {
      loadDraftHistory();
    }
    if (activeTab === 'versions') {
      loadDraftVersions();
    }
  }, [activeTab, draft.id]);

  useEffect(() => {
    // Load initial versions for comparison
    loadDraftVersions();
  }, [draft.id]);

  const loadDraftHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await dispatch(fetchDraftHistory(draft.id));
      setDraftHistory(response.payload || []);
    } catch (error) {
      console.error('Failed to load draft history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadDraftVersions = async () => {
    setLoadingVersions(true);
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`/api/drafts/${draft.id}/versions`);
      const data = await response.json();
      setDraftVersions(data.versions || []);
    } catch (error) {
      console.error('Failed to load draft versions:', error);
      // Mock data for development
      setDraftVersions([
        { version: 1, createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), interviewCount: 1, stage: 'first_draft' },
        { version: 2, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), interviewCount: 2, stage: 'in_progress' },
        { version: 3, createdAt: new Date(), interviewCount: 3, stage: 'pending_review' }
      ]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleApprove = async () => {
    try {
      await dispatch(approveDraft({ 
        draftId: draft.id, 
        notes: approvalNotes 
      }));
      setShowApprovalModal(false);
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Failed to approve draft:', error);
    }
  };

  const handleReject = async () => {
    if (rejectionReason.trim().length < 10) {
      alert(t('drafts.review.rejectionReasonRequired'));
      return;
    }
    
    try {
      await dispatch(rejectDraft({ 
        draftId: draft.id, 
        reason: rejectionReason 
      }));
      setShowRejectionModal(false);
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Failed to reject draft:', error);
    }
  };

  const handleStageChange = async (stage, reason = '') => {
    try {
      await dispatch(updateDraftStage({ 
        draftId: draft.id, 
        stage: stage,
        reason: reason 
      }));
      setShowStageTransition(false);
      setNewStage('');
      setStageTransitionReason('');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  const handleVersionCompare = (version) => {
    setSelectedVersion(version);
    setShowVersionCompare(true);
  };

  const getAvailableStageTransitions = (currentStage) => {
    const transitions = {
      'first_draft': ['in_progress'],
      'in_progress': ['pending_review'],
      'pending_review': ['under_review', 'in_progress'],
      'under_review': ['pending_approval', 'pending_review'],
      'pending_approval': ['approved', 'rejected', 'under_review'],
      'rejected': ['in_progress'],
      'approved': ['archived']
    };
    return transitions[currentStage] || [];
  };

  const filterHistory = (history) => {
    return history.filter(item => {
      if (historyFilters.action !== 'all' && item.action !== historyFilters.action) {
        return false;
      }
      if (historyFilters.user !== 'all' && item.user?.id !== historyFilters.user) {
        return false;
      }
      if (historyFilters.dateRange !== 'all') {
        const itemDate = new Date(item.createdAt);
        const now = new Date();
        const daysDiff = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24));
        
        switch (historyFilters.dateRange) {
          case 'today':
            return daysDiff === 0;
          case 'week':
            return daysDiff <= 7;
          case 'month':
            return daysDiff <= 30;
          default:
            return true;
        }
      }
      return true;
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStageColor = (stage) => {
    const colors = {
      first_draft: 'blue',
      in_progress: 'orange',
      pending_review: 'yellow',
      under_review: 'purple',
      pending_approval: 'indigo',
      approved: 'green',
      rejected: 'red',
      archived: 'gray'
    };
    return colors[stage] || 'gray';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  const renderOverviewTab = () => (
    <div className="draft-review__overview">
      {/* Draft Header */}
      <div className="draft-header">
        <div className="draft-header__main">
          <h2 className="draft-header__title">{draft.title}</h2>
          <div className="draft-header__meta">
            <div className="meta-item">
              <User size={16} />
              <span>{draft.user?.displayName || 'Unknown User'}</span>
            </div>
            <div className="meta-item">
              <Calendar size={16} />
              <span>{new Date(draft.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="meta-item">
              <Clock size={16} />
              <span>{t('drafts.version')} {draft.version}</span>
            </div>
          </div>
        </div>
        
        <div className="draft-header__status">
          <div className={`stage-badge stage-badge--${getStageColor(draft.stage)}`}>
            {t(`drafts.stages.${draft.stage}`)}
          </div>
          <div className="progress-indicator">
            <div className="progress-bar">
              <div 
                className={`progress-bar__fill progress-bar__fill--${getProgressColor(draft.progress?.overall || 0)}`}
                style={{ width: `${draft.progress?.overall || 0}%` }}
              />
            </div>
            <span className="progress-text">{Math.round(draft.progress?.overall || 0)}%</span>
          </div>
        </div>
      </div>

        {/* Enhanced Progress Visualization */}
        <div className="content-section">
          <div 
            className="content-section__header"
            onClick={() => toggleSection('progress')}
          >
            <div className="content-section__title">
              <TrendingUp size={20} />
              <h3>{t('drafts.content.progressBreakdown')}</h3>
            </div>
            <div className="content-section__progress">
              <span>{Math.round(draft.progress?.overall || 0)}%</span>
              {expandedSections.progress ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          
          {expandedSections.progress && (
            <div className="content-section__body">
              <div className="progress-breakdown">
                <div className="progress-grid">
                  <div className="progress-item">
                    <div className="progress-item__header">
                      <span className="progress-item__label">{t('drafts.sections.professional')}</span>
                      <span className="progress-item__value">{Math.round(draft.progress?.sections?.professional || 0)}%</span>
                    </div>
                    <div className="progress-bar progress-bar--sm">
                      <div 
                        className={`progress-bar__fill progress-bar__fill--${getProgressColor(draft.progress?.sections?.professional || 0)}`}
                        style={{ width: `${draft.progress?.sections?.professional || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="progress-item">
                    <div className="progress-item__header">
                      <span className="progress-item__label">{t('drafts.sections.technical')}</span>
                      <span className="progress-item__value">{Math.round(draft.progress?.sections?.technical || 0)}%</span>
                    </div>
                    <div className="progress-bar progress-bar--sm">
                      <div 
                        className={`progress-bar__fill progress-bar__fill--${getProgressColor(draft.progress?.sections?.technical || 0)}`}
                        style={{ width: `${draft.progress?.sections?.technical || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="progress-item">
                    <div className="progress-item__header">
                      <span className="progress-item__label">{t('drafts.sections.behavioral')}</span>
                      <span className="progress-item__value">{Math.round(draft.progress?.sections?.behavioral || 0)}%</span>
                    </div>
                    <div className="progress-bar progress-bar--sm">
                      <div 
                        className={`progress-bar__fill progress-bar__fill--${getProgressColor(draft.progress?.sections?.behavioral || 0)}`}
                        style={{ width: `${draft.progress?.sections?.behavioral || 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="progress-item">
                    <div className="progress-item__header">
                      <span className="progress-item__label">{t('drafts.content.interviews')}</span>
                      <span className="progress-item__value">{draft.interviewCount || 0} {t('drafts.content.completed')}</span>
                    </div>
                    <div className="interview-types">
                      {draft.content?.interviewTypes && Object.entries(draft.content.interviewTypes).map(([type, completed]) => (
                        <span key={type} className={`interview-type-badge ${completed ? 'completed' : 'pending'}`}>
                          {t(`interviews.types.${type}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Content Sections */}
      <div className="draft-content">
        {/* Professional Summary */}
        <div className="content-section">
          <div 
            className="content-section__header"
            onClick={() => toggleSection('professional')}
          >
            <div className="content-section__title">
              <Award size={20} />
              <h3>{t('drafts.sections.professional')}</h3>
            </div>
            <div className="content-section__progress">
              <span>{Math.round(draft.progress?.sections?.professional || 0)}%</span>
              {expandedSections.professional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          
          {expandedSections.professional && (
            <div className="content-section__body">
              <div className="professional-summary">
                <div className="summary-grid">
                  <div className="summary-item">
                    <h4>{t('drafts.content.overallRating')}</h4>
                    <div className="rating-display">
                      <Star className="rating-star" size={20} />
                      <span className="rating-value">{draft.content?.overallRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="summary-item">
                    <h4>{t('drafts.content.recommendation')}</h4>
                    <div className={`recommendation recommendation--${draft.content?.recommendation?.toLowerCase()}`}>
                      {t(`drafts.recommendations.${draft.content?.recommendation?.toLowerCase()}`)}
                    </div>
                  </div>
                </div>
                
                {draft.content?.summary && (
                  <div className="summary-text">
                    <h4>{t('drafts.content.summary')}</h4>
                    <p>{draft.content.summary}</p>
                  </div>
                )}
                
                {draft.content?.strengths && draft.content.strengths.length > 0 && (
                  <div className="strengths-list">
                    <h4>{t('drafts.content.strengths')}</h4>
                    <div className="tag-list">
                      {draft.content.strengths.map((strength, index) => (
                        <span key={index} className="tag tag--success">{strength}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {draft.content?.improvements && draft.content.improvements.length > 0 && (
                  <div className="improvements-list">
                    <h4>{t('drafts.content.improvements')}</h4>
                    <div className="tag-list">
                      {draft.content.improvements.map((improvement, index) => (
                        <span key={index} className="tag tag--warning">{improvement}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Technical Skills */}
        <div className="content-section">
          <div 
            className="content-section__header"
            onClick={() => toggleSection('technical')}
          >
            <div className="content-section__title">
              <TrendingUp size={20} />
              <h3>{t('drafts.sections.technical')}</h3>
            </div>
            <div className="content-section__progress">
              <span>{Math.round(draft.progress?.sections?.technical || 0)}%</span>
              {expandedSections.technical ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          
          {expandedSections.technical && (
            <div className="content-section__body">
              {draft.content?.skills && draft.content.skills.length > 0 && (
                <div className="skills-grid">
                  {draft.content.skills.map((skill, index) => (
                    <div key={index} className="skill-item">
                      <span className="skill-name">{skill}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Behavioral Assessment */}
        <div className="content-section">
          <div 
            className="content-section__header"
            onClick={() => toggleSection('behavioral')}
          >
            <div className="content-section__title">
              <MessageSquare size={20} />
              <h3>{t('drafts.sections.behavioral')}</h3>
            </div>
            <div className="content-section__progress">
              <span>{Math.round(draft.progress?.sections?.behavioral || 0)}%</span>
              {expandedSections.behavioral ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          
          {expandedSections.behavioral && (
            <div className="content-section__body">
              {draft.content?.achievements && draft.content.achievements.length > 0 && (
                <div className="achievements-list">
                  <h4>{t('drafts.content.achievements')}</h4>
                  <ul>
                    {draft.content.achievements.map((achievement, index) => (
                      <li key={index}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interview Details */}
        <div className="content-section">
          <div 
            className="content-section__header"
            onClick={() => toggleSection('interviews')}
          >
            <div className="content-section__title">
              <FileText size={20} />
              <h3>{t('drafts.sections.interviews')}</h3>
            </div>
            <div className="content-section__progress">
              <span>{draft.content?.interviewCount || 0} {t('drafts.content.completed')}</span>
              {expandedSections.interviews ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          
          {expandedSections.interviews && (
            <div className="content-section__body">
              {/* Interview Summary Stats */}
              <div className="interview-stats">
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">{t('drafts.content.averageRating')}</span>
                    <span className="stat-value">
                      <Star size={16} />
                      {draft.content?.averageRating?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('drafts.content.totalDuration')}</span>
                    <span className="stat-value">
                      <Clock size={16} />
                      {draft.content?.totalDuration || 'N/A'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">{t('drafts.content.interviewTypes')}</span>
                    <span className="stat-value">
                      {draft.content?.completedTypes?.length || 0} / 4
                    </span>
                  </div>
                </div>
              </div>

              {/* Aggregated Skills & Strengths */}
              {draft.content?.aggregatedSkills && draft.content.aggregatedSkills.length > 0 && (
                <div className="aggregated-content">
                  <h4>{t('drafts.content.aggregatedSkills')}</h4>
                  <div className="skills-grid">
                    {draft.content.aggregatedSkills.map((skill, index) => (
                      <div key={index} className="skill-item">
                        <span className="skill-name">{skill.name}</span>
                        <div className="skill-rating">
                          <div className="skill-bar">
                            <div 
                              className="skill-bar__fill"
                              style={{ width: `${(skill.rating / 5) * 100}%` }}
                            />
                          </div>
                          <span className="skill-value">{skill.rating}/5</span>
                        </div>
                        <span className="skill-mentions">{skill.mentions} mentions</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Interview Details */}
              <div className="interviews-list">
                <h4>{t('drafts.content.individualInterviews')}</h4>
                {draft.content?.interviews && draft.content.interviews.map((interview, index) => (
                  <div key={index} className="interview-item">
                    <div className="interview-item__header">
                      <div className="interview-meta">
                        <span className={`interview-type interview-type--${interview.type?.toLowerCase()}`}>
                          {t(`interviews.types.${interview.type?.toLowerCase()}`)}
                        </span>
                        <span className="interview-date">{new Date(interview.completedAt).toLocaleDateString()}</span>
                        <span className="interview-duration">{interview.duration || 'N/A'}</span>
                      </div>
                      <div className="interview-rating">
                        <Star size={16} />
                        <span>{interview.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {interview.summary && (
                      <div className="interview-summary">
                        <p>{interview.summary}</p>
                      </div>
                    )}
                    
                    <div className="interview-details">
                      {interview.strengths && interview.strengths.length > 0 && (
                        <div className="interview-strengths">
                          <span className="detail-label">{t('drafts.content.strengths')}:</span>
                          <div className="tag-list">
                            {interview.strengths.map((strength, strengthIndex) => (
                              <span key={strengthIndex} className="tag tag--success">{strength}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {interview.improvements && interview.improvements.length > 0 && (
                        <div className="interview-improvements">
                          <span className="detail-label">{t('drafts.content.improvements')}:</span>
                          <div className="tag-list">
                            {interview.improvements.map((improvement, improvementIndex) => (
                              <span key={improvementIndex} className="tag tag--warning">{improvement}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {interview.keyPoints && interview.keyPoints.length > 0 && (
                        <div className="interview-points">
                          <span className="detail-label">{t('drafts.content.keyPoints')}:</span>
                          <div className="tag-list">
                            {interview.keyPoints.map((point, pointIndex) => (
                              <span key={pointIndex} className="tag tag--info">{point}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );



  const renderVersionsTab = () => (
    <div className="draft-review__versions">
      <div className="versions-header">
        <h3>{t('drafts.review.versions.title')}</h3>
        <p className="versions-subtitle">{t('drafts.review.versions.subtitle')}</p>
      </div>
      
      {loadingVersions ? (
        <LoadingSpinner />
      ) : (
        <div className="versions-list">
          {draftVersions.map((version, index) => (
            <div key={version.version} className={`version-item ${version.version === draft.version ? 'version-item--current' : ''}`}>
              <div className="version-header">
                <div className="version-info">
                  <h4 className="version-number">
                    {t('drafts.content.version')} {version.version}
                    {version.version === draft.version && (
                      <span className="current-badge">{t('drafts.review.versions.current')}</span>
                    )}
                  </h4>
                  <div className="version-meta">
                    <span className="version-date">
                      <Calendar size={14} />
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                    <span className="version-interviews">
                      <MessageSquare size={14} />
                      {version.interviewCount} {t('drafts.content.interviews')}
                    </span>
                    <span className={`version-stage stage-badge--${getStageColor(version.stage)}`}>
                      {t(`drafts.stages.${version.stage}`)}
                    </span>
                  </div>
                </div>
                
                <div className="version-actions">
                  {version.version !== draft.version && (
                    <button 
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleVersionCompare(version)}
                    >
                      <Eye size={14} />
                      {t('drafts.actions.compare')}
                    </button>
                  )}
                </div>
              </div>
              
              {version.changes && (
                <div className="version-changes">
                  <h5>{t('drafts.review.versions.changes')}</h5>
                  <ul className="changes-list">
                    {version.changes.map((change, changeIndex) => (
                      <li key={changeIndex} className={`change-item change-item--${change.type}`}>
                        <span className="change-type">{t(`drafts.review.versions.changeTypes.${change.type}`)}</span>
                        <span className="change-description">{change.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="draft-review__history">
      <div className="history-filters">
        <div className="filter-group">
          <label>{t('drafts.history.filters.action')}</label>
          <select 
            value={historyFilters.action}
            onChange={(e) => setHistoryFilters(prev => ({ ...prev, action: e.target.value }))}
            className="form-control form-control--sm"
          >
            <option value="all">{t('common.all')}</option>
            <option value="created">{t('drafts.history.actions.created')}</option>
            <option value="updated">{t('drafts.history.actions.updated')}</option>
            <option value="approved">{t('drafts.history.actions.approved')}</option>
            <option value="rejected">{t('drafts.history.actions.rejected')}</option>
            <option value="stage_changed">{t('drafts.history.actions.stage_changed')}</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>{t('drafts.history.filters.dateRange')}</label>
          <select 
            value={historyFilters.dateRange}
            onChange={(e) => setHistoryFilters(prev => ({ ...prev, dateRange: e.target.value }))}
            className="form-control form-control--sm"
          >
            <option value="all">{t('common.all')}</option>
            <option value="today">{t('drafts.history.filters.today')}</option>
            <option value="week">{t('drafts.history.filters.week')}</option>
            <option value="month">{t('drafts.history.filters.month')}</option>
          </select>
        </div>
      </div>
      
      {loadingHistory ? (
        <LoadingSpinner />
      ) : (
        <div className="history-timeline">
          {filterHistory(draftHistory).length === 0 ? (
            <div className="no-history">
              <AlertTriangle size={48} />
              <p>{t('drafts.history.noHistory')}</p>
            </div>
          ) : (
            filterHistory(draftHistory).map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-item__icon">
                  {item.action === 'created' && <FileText size={16} />}
                  {item.action === 'updated' && <Edit size={16} />}
                  {item.action === 'approved' && <CheckCircle size={16} />}
                  {item.action === 'rejected' && <XCircle size={16} />}
                  {item.action === 'stage_changed' && <TrendingUp size={16} />}
                </div>
                
                <div className="history-item__content">
                  <div className="history-item__header">
                    <span className="history-action">
                      {t(`drafts.history.actions.${item.action}`)}
                    </span>
                    <span className="history-date">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  {item.description && (
                    <p className="history-description">{item.description}</p>
                  )}
                  
                  {item.user && (
                    <div className="history-user">
                      <User size={14} />
                      <span>{item.user.displayName || item.user.email}</span>
                    </div>
                  )}
                  
                  {item.changes && item.changes.length > 0 && (
                    <div className="history-changes">
                      <details>
                        <summary>{t('drafts.history.viewChanges')}</summary>
                        <ul className="changes-list">
                          {item.changes.map((change, changeIndex) => (
                            <li key={changeIndex}>{change}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="draft-review">
      <div className="draft-review__overlay" onClick={onClose} />
      
      <div className="draft-review__modal">
        <div className="draft-review__header">
          <div className="draft-review__title">
            <FileText size={24} />
            <h2>{t('drafts.review.title')}</h2>
          </div>
          
          <div className="draft-review__actions">
            {draft.stage === 'pending_review' && (
              <>
                <button 
                  className="btn btn--success"
                  onClick={() => setShowApprovalModal(true)}
                  disabled={loading}
                >
                  <CheckCircle size={16} />
                  {t('drafts.actions.approve')}
                </button>
                <button 
                  className="btn btn--danger"
                  onClick={() => setShowRejectionModal(true)}
                  disabled={loading}
                >
                  <XCircle size={16} />
                  {t('drafts.actions.reject')}
                </button>
              </>
            )}
            
            <button className="btn btn--secondary">
              <Download size={16} />
              {t('drafts.actions.export')}
            </button>
            
            <button className="btn btn--ghost" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="draft-review__tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Eye size={16} />
            {t('drafts.tabs.overview')}
          </button>
          <button 
            className={`tab ${activeTab === 'versions' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('versions')}
          >
            <FileText size={16} />
            {t('drafts.tabs.versions')}
          </button>
          <button 
            className={`tab ${activeTab === 'history' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            {t('drafts.tabs.history')}
          </button>
        </div>

        <div className="draft-review__content">
          {error && (
            <ErrorAlert message={error} onClose={() => {}} />
          )}
          
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'versions' && renderVersionsTab()}
          {activeTab === 'history' && renderHistoryTab()}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>{t('drafts.approval.title')}</h3>
              <button onClick={() => setShowApprovalModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal__body">
              <p>{t('drafts.approval.confirmMessage')}</p>
              <textarea
                placeholder={t('drafts.approval.notesPlaceholder')}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="form-control"
                rows={4}
              />
            </div>
            <div className="modal__footer">
              <button 
                className="btn btn--secondary"
                onClick={() => setShowApprovalModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button 
                className="btn btn--success"
                onClick={handleApprove}
                disabled={loading}
              >
                <CheckCircle size={16} />
                {t('drafts.actions.approve')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>{t('drafts.rejection.title')}</h3>
              <button onClick={() => setShowRejectionModal(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal__body">
              <p>{t('drafts.rejection.confirmMessage')}</p>
              <textarea
                placeholder={t('drafts.rejection.reasonPlaceholder')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="form-control"
                rows={4}
                required
              />
              <div className="form-help">
                {t('drafts.rejection.reasonRequired')}
              </div>
            </div>
            <div className="modal__footer">
              <button 
                className="btn btn--secondary"
                onClick={() => setShowRejectionModal(false)}
              >
                {t('common.cancel')}
              </button>
              <button 
                className="btn btn--danger"
                onClick={handleReject}
                disabled={loading || rejectionReason.trim().length < 10}
              >
                <XCircle size={16} />
                {t('drafts.actions.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftReview;
