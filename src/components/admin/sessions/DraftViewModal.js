import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  FileText, 
  User,
  MessageSquare,
  Save,
  Edit3,
  Hash,
} from 'lucide-react';
import { addNoteToDraft, updateDraftStageSupabase } from '../../../store/slices/draftsSlice';

const DraftViewModal = ({ 
  isOpen, 
  onClose, 
  draft, 
  interview, 
  session,
  onRegenerate,
  onDraftUpdated, // New prop to refresh parent state
  loading = false
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // Local state for notes editing
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [regenerateReason, setRegenerateReason] = useState('');
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  // Initialize notes when modal opens
  useEffect(() => {
    if (isOpen && draft) {
      // Get notes from content.notes array and join them
      const notesText = draft?.content?.notes?.map(note => note.content || note).join('\n') || '';
      setNotes(notesText);
      setIsEditingNotes(false);
      setShowRegenerateForm(false);
      setShowRejectionForm(false);
      setRegenerateReason('');
      setRejectionReason('');
    }
  }, [isOpen, draft]);

  if (!isOpen || !draft) return null;

  const handleSaveNotes = async () => {
    if (!notes.trim() || !draft?.id || !session?.id) return;
    
    try {
      await dispatch(addNoteToDraft({
        sessionId: session.id,
        draftId: draft.id,
        content: notes.trim(),
        author: 'Admin User' // In production, get from auth state
      })).unwrap();
      
      // Refresh parent state
      if (onDraftUpdated) {
        onDraftUpdated();
      }
      
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert(t('admin.drafts.updateNotesError', 'Failed to update draft notes'));
    }
  };

  const handleApprove = async () => {
    if (!draft?.id) return;
    
    try {
      await dispatch(updateDraftStageSupabase({
        sessionId: session.id,
        draftId: draft.id,
        stage: 'approved',
        approvedBy: 'Admin User'
      })).unwrap();
      
      // Refresh parent state
      if (onDraftUpdated) {
        onDraftUpdated();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to approve draft:', error);
      alert(t('admin.drafts.approveError', 'Failed to approve draft'));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert(t('admin.drafts.rejectionReasonRequired', 'Please provide a reason for rejection'));
      return;
    }
    if (!draft?.id) return;
    
    try {
      await dispatch(updateDraftStageSupabase({
        sessionId: session.id,
        draftId: draft.id,
        stage: 'rejected',
        rejectionReason: rejectionReason,
        rejectedBy: 'Admin User'
      })).unwrap();
      
      // Refresh parent state
      if (onDraftUpdated) {
        onDraftUpdated();
      }
      
      setShowRejectionForm(false);
      setRejectionReason('');
      onClose();
    } catch (error) {
      console.error('Failed to reject draft:', error);
      alert(t('admin.drafts.rejectError', 'Failed to reject draft'));
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(draft.id, regenerateReason);
    }
    setShowRegenerateForm(false);
    setRegenerateReason('');
  };

  const renderSections = () => {
    if (!draft.content?.sections) return null;

    // Handle both object and array formats
    if (Array.isArray(draft.content.sections)) {
      return draft.content.sections.map((section, index) => (
        <div key={index} className="draft-subsection">
          <h6>{section.title}</h6>
          <div className="draft-section-content">
            {section.content}
          </div>
        </div>
      ));
    } else {
      // Handle object format (Hebrew sections from AI)
      return Object.entries(draft.content.sections).map(([sectionTitle, sectionContent]) => (
        <div key={sectionTitle} className="section-card">
          <h4>{sectionTitle}</h4>
          <div className="section-content hebrew-content">
            <pre>{sectionContent}</pre>
          </div>
        </div>
      ));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending_review': return 'warning';
      case 'draft': return 'info';
      default: return 'secondary';
    }
  };

  // Get draft status from stage field
  const draftStatus = draft?.stage;
  const isFinalized = draftStatus === 'approved' || draftStatus === 'rejected';
  
  // Get approval/rejection metadata
  const approvalMetadata = draft?.content?.approval_metadata;
  const rejectionMetadata = draft?.content?.rejection_metadata;
  
  // Get notes from content.notes array
  const draftNotes = draft?.content?.notes || [];
  const hasNewNotes = draftNotes.length > 0;
  
  const canApprove = !isFinalized;
  const canReject = !isFinalized;
  const canRegenerate = hasNewNotes && !isFinalized; // Only if has notes and not finalized
  const canEditNotes = !isFinalized;

  return (
    <div className="draft-modal-overlay" onClick={onClose}>
      <div className="draft-modal" onClick={(e) => e.stopPropagation()}>
        <div className="draft-modal__header">
          <div className="draft-modal__title">
            <FileText size={24} />
            <div>
              <h2>{draft?.title || t('admin.sessions.draftDetails', 'Draft Details')}</h2>
              <span className={`status-badge status-badge--${getStatusColor(draftStatus)}`}>
                {t(`admin.drafts.status.${draftStatus}`, draftStatus)}
              </span>
            </div>
          </div>
          <div className="draft-modal__actions">
            {canApprove && (
              <button 
                className="btn btn--success"
                onClick={handleApprove}
                disabled={loading}
              >
                <CheckCircle size={16} />
                {t('admin.drafts.approve', 'Approve')}
              </button>
            )}
            {canReject && (
              <button 
                className="btn btn--danger"
                onClick={() => setShowRejectionForm(true)}
                disabled={loading}
              >
                <XCircle size={16} />
                {t('admin.drafts.reject', 'Reject')}
              </button>
            )}
            {canRegenerate && (
              <button 
                className="btn btn--warning"
                onClick={() => setShowRegenerateForm(true)}
                disabled={loading}
              >
                <RefreshCw size={16} />
                {t('admin.drafts.regenerate', 'Regenerate')}
              </button>
            )}
            <button className="btn btn--ghost" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="draft-modal__content">
          {/* Sidebar */}
          <div className="draft-modal__sidebar">
            {/* Approval/Rejection Info */}
            {isFinalized && (
              <div className={`sidebar-section approval-section ${draftStatus === 'approved' ? 'approval-section--approved' : 'approval-section--rejected'}`}>
                <h4>
                  {draftStatus === 'approved' ? (
                    <><CheckCircle size={16} /> {t('admin.sessions.sessionDrafts.approvalInfo', 'Approval Info')}</>
                  ) : (
                    <><XCircle size={16} /> {t('admin.sessions.sessionDrafts.rejectionInfo', 'Rejection Info')}</>
                  )}
                </h4>
                <div className="info-list">
                  <div className="info-item">
                    <label>
                      {draftStatus === 'approved' ? 
                        t('admin.sessions.sessionDrafts.approvedBy', 'Approved By') : 
                        t('admin.sessions.sessionDrafts.rejectedBy', 'Rejected By')
                      }
                    </label>
                    <span>{approvalMetadata?.approved_by || rejectionMetadata?.rejected_by || 'Admin User'}</span>
                  </div>
                  <div className="info-item">
                    <label>
                      {draftStatus === 'approved' ? 
                        t('admin.sessions.sessionDrafts.approvedAt', 'Approved At') : 
                        t('admin.sessions.sessionDrafts.rejectedAt', 'Rejected At')
                      }
                    </label>
                    <span>
                      {approvalMetadata?.approved_at || rejectionMetadata?.rejected_at ? 
                        new Date(approvalMetadata?.approved_at || rejectionMetadata?.rejected_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {draftStatus === 'rejected' && rejectionMetadata?.rejection_reason && (
                    <div className="info-item">
                      <label>{t('admin.sessions.sessionDrafts.rejectionReason', 'Rejection Reason')}</label>
                      <span className="rejection-reason">{rejectionMetadata.rejection_reason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Draft Info */}
            <div className="sidebar-section">
              <h4>
                <Hash size={16} />
                {t('admin.sessions.draftInfo', 'Draft Information')}
              </h4>
              <div className="info-list">
                <div className="info-item">
                  <label>{t('admin.sessions.draftVersion', 'Version')}</label>
                  <span>{draft?.version || 1}</span>
                </div>
                <div className="info-item">
                  <label>{t('admin.sessions.createdAt', 'Created At')}</label>
                  <span>{draft?.createdAt ? new Date(draft.createdAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>{t('admin.sessions.wordCount', 'Word Count')}</label>
                  <span>{draft?.content?.metadata?.wordCount || 0}</span>
                </div>
                <div className="info-item">
                  <label>{t('admin.sessions.readingTime', 'Reading Time')}</label>
                  <span>{draft?.content?.metadata?.estimatedReadingTime || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>{t('admin.sessions.aiModel', 'AI Model')}</label>
                  <span>{draft?.content?.metadata?.aiModel || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Session Context */}
            {session && (
              <div className="sidebar-section">
                <h4>
                  <User size={16} />
                  {t('admin.sessions.sessionInfo', 'Session Info')}
                </h4>
                <div className="info-list">
                  <div className="info-item">
                    <label>{t('admin.sessions.clientName', 'Client')}</label>
                    <span>{session.client_name}</span>
                  </div>
                  <div className="info-item">
                    <label>{t('admin.sessions.interviewDate', 'Interview Date')}</label>
                    <span>{interview?.created_at ? new Date(interview.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}



            {/* Notes Section */}
            <div className="sidebar-section sidebar-section--notes">
              <div className="section-header">
                <h4>
                  <MessageSquare size={16} />
                  {t('admin.drafts.notes', 'Notes')}
                </h4>
                {!isEditingNotes && canEditNotes ? (
                  <button 
                    className="btn btn--ghost btn--sm"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    <Edit3 size={14} />
                    {t('common.edit', 'Edit')}
                  </button>
                ) : isEditingNotes ? (
                  <div className="notes-actions">
                    <button 
                      className="btn btn--success btn--sm"
                      onClick={handleSaveNotes}
                      disabled={loading}
                    >
                      <Save size={14} />
                      {t('common.save', 'Save')}
                    </button>
                    <button 
                      className="btn btn--ghost btn--sm"
                      onClick={() => {
                        setIsEditingNotes(false);
                        setNotes(draft?.notes || '');
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}
              </div>
              {isEditingNotes && canEditNotes ? (
                <textarea
                  className="notes-textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('admin.drafts.notesPlaceholder', 'Add notes about this draft...')}
                  rows={6}
                />
              ) : (
                <div className="notes-display">
                  {notes || t('admin.drafts.noNotes', 'No notes added yet')}
                  {!canEditNotes && (
                    <div className="notes-disabled-info">
                      <small>{t('admin.drafts.notesDisabled', 'Notes cannot be edited for approved/rejected drafts')}</small>
                    </div>
                  )}
                  {canEditNotes && !hasNewNotes && (
                    <div className="notes-info">
                      <small>{t('admin.drafts.addNotesToRegenerate', 'Add notes to enable draft regeneration')}</small>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="draft-modal__main">
            {draft?.content && (
              <div className="draft-content">
                {draft.content.summary && (
                  <div className="content-section">
                    <h3>{t('admin.sessions.summary', 'Summary')}</h3>
                    <div className="content-text hebrew-content">
                      <pre>{draft.content.summary}</pre>
                    </div>
                  </div>
                )}
                
                {draft.content.sections && (
                  <div className="content-section">
                    <h3>{t('admin.sessions.sections', 'Sections')}</h3>
                    <div className="sections-grid">
                      {renderSections()}
                    </div>
                  </div>
                )}
                
                {draft.content.keyThemes && Array.isArray(draft.content.keyThemes) && draft.content.keyThemes.length > 0 && (
                  <div className="content-section">
                    <h3>{t('admin.sessions.keyThemes', 'Key Themes')}</h3>
                    <div className="key-themes">
                      {draft.content.keyThemes.map((theme, index) => (
                        <span key={index} className="theme-tag">{theme}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rejection Form */}
        {showRejectionForm && (
          <div className="form-overlay">
            <div className="form-modal">
              <div className="form-header">
                <h4>{t('admin.drafts.rejectDraft', 'Reject Draft')}</h4>
                <button 
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason('');
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="form-content">
                <p>{t('admin.drafts.rejectionReasonPrompt', 'Please provide a reason for rejecting this draft:')}</p>
                <textarea
                  className="form-textarea"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t('admin.drafts.rejectionReasonPlaceholder', 'Explain why this draft needs to be rejected...')}
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button 
                  className="btn btn--danger"
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || loading}
                >
                  <XCircle size={16} />
                  {t('admin.drafts.confirmReject', 'Confirm Rejection')}
                </button>
                <button 
                  className="btn btn--secondary"
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason('');
                  }}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Regenerate Form */}
        {showRegenerateForm && (
          <div className="form-overlay">
            <div className="form-modal">
              <div className="form-header">
                <h4>{t('admin.drafts.regenerateDraft', 'Regenerate Draft')}</h4>
                <button 
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setShowRegenerateForm(false);
                    setRegenerateReason('');
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="form-content">
                <p>{t('admin.drafts.regeneratePrompt', 'Provide instructions for regenerating this draft (optional):')}</p>
                <textarea
                  className="form-textarea"
                  value={regenerateReason}
                  onChange={(e) => setRegenerateReason(e.target.value)}
                  placeholder={t('admin.drafts.regeneratePlaceholder', 'Add specific instructions for the AI to improve the draft...')}
                  rows={4}
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button 
                  className="btn btn--warning"
                  onClick={handleRegenerate}
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  {t('admin.drafts.confirmRegenerate', 'Regenerate Draft')}
                </button>
                <button 
                  className="btn btn--secondary"
                  onClick={() => {
                    setShowRegenerateForm(false);
                    setRegenerateReason('');
                  }}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftViewModal;
