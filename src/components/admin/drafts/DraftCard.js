import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { 
  FileText, 
  User, 
  Calendar, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Download,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  History,
  Award,
  Briefcase
} from 'lucide-react';
import { updateDraftStage, exportDraft } from '../../../store/slices/draftsSlice';

const DraftCard = ({ draft, isSelected, onSelect, onReview }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const getStageColor = (stage) => {
    switch (stage) {
      case 'first_draft':
        return 'stage--first';
      case 'under_review':
        return 'stage--review';
      case 'pending_approval':
        return 'stage--pending';
      case 'approved':
        return 'stage--approved';
      case 'rejected':
        return 'stage--rejected';
      default:
        return 'stage--default';
    }
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'first_draft':
        return <FileText size={16} />;
      case 'under_review':
        return <Eye size={16} />;
      case 'pending_approval':
        return <Clock size={16} />;
      case 'approved':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'progress--high';
    if (progress >= 50) return 'progress--medium';
    return 'progress--low';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewDraft = (e) => {
    e.stopPropagation();
    navigate(`/admin/drafts/${draft.id}`);
  };

  const handleEditDraft = (e) => {
    e.stopPropagation();
    navigate(`/admin/drafts/${draft.id}/edit`);
  };

  const handleExportDraft = (e, format) => {
    e.stopPropagation();
    dispatch(exportDraft({ draftId: draft.id, format }));
    setShowExportMenu(false);
  };

  const handleApprove = (e) => {
    e.stopPropagation();
    dispatch(updateDraftStage({ draftId: draft.id, stage: 'approved' }));
  };

  const handleReject = (e) => {
    e.stopPropagation();
    const reason = prompt(t('drafts.approval.rejectionReason'));
    if (reason) {
      dispatch(updateDraftStage({ draftId: draft.id, stage: 'rejected', reason }));
    }
  };

  const handleMoveToReview = (e) => {
    e.stopPropagation();
    dispatch(updateDraftStage({ draftId: draft.id, stage: 'under_review' }));
  };

  const toggleExpanded = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`draft-card ${isSelected ? 'draft-card--selected' : ''} ${isExpanded ? 'draft-card--expanded' : ''}`}>
      <div className="draft-card__header" onClick={toggleExpanded}>
        <div className="draft-card__checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="checkbox"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        <div className="draft-card__title-section">
          <h3 className="draft-card__title">{draft.title || `Draft #${draft.id}`}</h3>
          <div className="draft-card__meta">
            <span className="draft-card__version">
              <FileText size={14} />
              {t('drafts.card.version')} {draft.version || 1}
            </span>
            {draft.session && (
              <span className="draft-card__session">
                <Briefcase size={14} />
                {draft.session.title || draft.session.id}
              </span>
            )}
            <span className="draft-card__interviews">
              <MessageSquare size={14} />
              {draft.interviewCount || 0} {t('common.interviews', 'interviews')}
            </span>
          </div>
        </div>

        <div className="draft-card__header-right">
          <div className={`draft-card__stage ${getStageColor(draft.stage)}`}>
            <div className="draft-card__stage-icon">
              {getStageIcon(draft.stage)}
            </div>
            <span className="draft-card__stage-text">
              {t(`drafts.stages.${draft.stage}`)}
            </span>
          </div>
          
          <div className="draft-card__progress-mini">
            <div className="progress-circle">
              <svg className="progress-circle__svg" viewBox="0 0 36 36">
                <path
                  className="progress-circle__bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`progress-circle__fill ${getProgressColor(draft.progress?.completion || 0)}`}
                  strokeDasharray={`${draft.progress?.completion || 0}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="progress-circle__text">
                {Math.round(draft.progress?.completion || 0)}%
              </div>
            </div>
          </div>
          
          <button className="draft-card__expand-btn">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Compact Summary - Always Visible */}
      <div className="draft-card__summary">
        <div className="draft-card__summary-grid">
          <div className="draft-card__summary-item">
            <User className="summary-icon" size={16} />
            <span className="summary-text">
              {draft.user?.displayName || draft.user?.name || 'Unknown User'}
            </span>
          </div>
          
          <div className="draft-card__summary-item">
            <Calendar className="summary-icon" size={16} />
            <span className="summary-text">
              {formatDate(draft.updatedAt || draft.createdAt)}
            </span>
          </div>
          
          {draft.reviewedBy && (
            <div className="draft-card__summary-item">
              <Award className="summary-icon" size={16} />
              <span className="summary-text">
                {t('drafts.card.reviewedBy')}: {draft.reviewedBy}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="draft-card__expanded-content">
          {/* Detailed Progress */}
          <div className="draft-card__progress-detailed">
            <h4 className="section-title">{t('drafts.card.progress')}</h4>
            
            {/* Section Progress */}
            {draft.progress?.sections && (
              <div className="draft-card__sections">
                <div className="draft-card__section-progress">
                  <div className="section-header">
                    <User size={16} />
                    <span className="section-label">{t('drafts.review.sections.personal')}</span>
                    <span className="section-percentage">{draft.progress.sections.personal || 0}%</span>
                  </div>
                  <div className="section-bar">
                    <div 
                      className="section-fill"
                      style={{ width: `${draft.progress.sections.personal || 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="draft-card__section-progress">
                  <div className="section-header">
                    <Briefcase size={16} />
                    <span className="section-label">{t('drafts.review.sections.professional')}</span>
                    <span className="section-percentage">{draft.progress.sections.professional || 0}%</span>
                  </div>
                  <div className="section-bar">
                    <div 
                      className="section-fill"
                      style={{ width: `${draft.progress.sections.professional || 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="draft-card__section-progress">
                  <div className="section-header">
                    <Award size={16} />
                    <span className="section-label">{t('drafts.review.sections.recommendations')}</span>
                    <span className="section-percentage">{draft.progress.sections.recommendations || 0}%</span>
                  </div>
                  <div className="section-bar">
                    <div 
                      className="section-fill"
                      style={{ width: `${draft.progress.sections.recommendations || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Preview */}
          {draft.content && (
            <div className="draft-card__content-preview">
              <h4 className="section-title">{t('drafts.review.content')}</h4>
              
              {draft.content.recommendations && (
                <div className="content-section">
                  <h5 className="content-section__title">{t('drafts.review.sections.recommendations')}</h5>
                  {draft.content.recommendations.decision && (
                    <div className={`decision-badge decision-badge--${draft.content.recommendations.decision.includes('recommend') ? 'positive' : 'negative'}`}>
                      {draft.content.recommendations.decision}
                    </div>
                  )}
                  {draft.content.recommendations.strengths && (
                    <div className="content-item">
                      <strong>{t('common.strengths', 'Strengths')}:</strong>
                      <ul>
                        {draft.content.recommendations.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="draft-card__footer">
        <div className="draft-card__actions">
          <button 
            className="btn btn--secondary btn--sm"
            onClick={handleViewDraft}
            title={t('drafts.actions.view')}
          >
            <Eye size={16} />
            <span className="btn-text">{t('drafts.actions.view')}</span>
          </button>
          
          <button 
            className="btn btn--primary btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              onReview && onReview(draft);
            }}
            title={t('drafts.actions.reviewDetailed')}
          >
            <FileText size={16} />
            <span className="btn-text">{t('drafts.actions.reviewDetailed')}</span>
          </button>
          
          {['first_draft', 'under_review', 'rejected'].includes(draft.stage) && (
            <button 
              className="btn btn--secondary btn--sm"
              onClick={handleEditDraft}
              title={t('drafts.actions.edit')}
            >
              <Edit size={16} />
              <span className="btn-text">{t('drafts.actions.edit')}</span>
            </button>
          )}
          
          {draft.stage === 'first_draft' && (
            <button 
              className="btn btn--primary btn--sm"
              onClick={handleMoveToReview}
              title={t('drafts.actions.review')}
            >
              <Eye size={16} />
              <span className="btn-text">{t('drafts.actions.review')}</span>
            </button>
          )}
          
          {draft.stage === 'under_review' && (
            <>
              <button 
                className="btn btn--success btn--sm"
                onClick={handleApprove}
                title={t('drafts.actions.approve')}
              >
                <CheckCircle size={16} />
                <span className="btn-text">{t('drafts.actions.approve')}</span>
              </button>
              <button 
                className="btn btn--danger btn--sm"
                onClick={handleReject}
                title={t('drafts.actions.reject')}
              >
                <XCircle size={16} />
                <span className="btn-text">{t('drafts.actions.reject')}</span>
              </button>
            </>
          )}
          
          {['approved', 'pending_approval'].includes(draft.stage) && (
            <div className="dropdown" onMouseLeave={() => setShowExportMenu(false)}>
              <button 
                className="btn btn--secondary btn--sm"
                onMouseEnter={() => setShowExportMenu(true)}
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <Download size={16} />
                <span className="btn-text">{t('drafts.actions.export')}</span>
              </button>
              {showExportMenu && (
                <div className="dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={(e) => handleExportDraft(e, 'pdf')}
                  >
                    {t('drafts.actions.exportPdf')}
                  </button>
                  <button 
                    className="dropdown-item"
                    onClick={(e) => handleExportDraft(e, 'json')}
                  >
                    {t('drafts.actions.exportJson')}
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button 
            className="btn btn--ghost btn--sm"
            onClick={(e) => {
              e.stopPropagation();
              // Handle view history
            }}
            title={t('drafts.actions.viewHistory')}
          >
            <History size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftCard;
