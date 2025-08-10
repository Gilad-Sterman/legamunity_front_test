import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDraftsBySession, updateDraftContent, updateDraftStage, addNoteToDraft, updateDraftStageSupabase } from '../../store/slices/draftsSlice';
import { fetchSessionById } from '../../store/slices/sessionsSliceSupabase';
import {
  ArrowLeft,
  FileText,
  Edit3,
  Save,
  X,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MessageSquare,
  Plus,
  Eye,
  Download,
  History,
  AlertTriangle
} from 'lucide-react';

const SessionDrafts = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const { items: drafts = [], loading, error, sessionDraftsCount } = useSelector(state => state.drafts || {});
  const { sessions = [] } = useSelector(state => state.sessions || {});

  // Local state
  const [editingSection, setEditingSection] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [notes, setNotes] = useState('');
  const [newNote, setNewNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDraftId, setSelectedDraftId] = useState(null);

  // Get current session and draft from Redux state
  const session = sessions.find(s => s.id === sessionId);
  // Find a draft with enriched data (session_info), fallback to first draft
  const draft = drafts.length > 0 ? 
    (drafts.find(d => d.session_info) || drafts[0]) : null;

  // Fetch real data from Redux/API
  useEffect(() => {
    if (sessionId) {
      // Fetch session data if not already loaded
      if (!session) {
        dispatch(fetchSessionById(sessionId));
      }

      // Fetch drafts for this session
      dispatch(fetchDraftsBySession(sessionId));
    }
  }, [sessionId, dispatch, session]);

  // Initialize notes from draft data
  useEffect(() => {
    if (draft && draft.notes) {
      setNotes(draft.notes);
    }
  }, [draft]);



  const handleEditSection = (sectionKey, content) => {
    setEditingSection(sectionKey);
    setEditContent(content);
  };

  const handleSaveSection = async () => {
    try {
      // Update draft content
      const updatedDraft = {
        ...draft,
        content: {
          ...draft.content,
          sections: {
            ...draft.content.sections,
            [editingSection]: {
              ...draft.content.sections[editingSection],
              content: editContent
            }
          }
        },
        updatedAt: new Date().toISOString()
      };

      // setDraft(updatedDraft);
      setEditingSection(null);
      setEditContent('');

      // In production, dispatch API call to save changes
      // dispatch(updateDraftContent({ draftId: draft.id, section: editingSection, content: editContent }));

    } catch (err) {
      console.error('Error saving section:', err);
      // setError('Failed to save changes');
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditContent('');
  };

  const handleAddNote = async (draftId) => {
    if (!newNote.trim()) return;

    try {
      // Dispatch the Redux action to add note to draft
      await dispatch(addNoteToDraft({
        sessionId,
        draftId,
        content: newNote.trim(),
        author: 'Admin User' // In production, get from auth state
      })).unwrap();

      // Clear the input on success
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
      // setError('Failed to add note');
    }
  };

  const handleApprovalAction = async (action, draftId) => {
    setApprovalAction(action);
    setSelectedDraftId(draftId);
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    try {
      // Dispatch the Redux action to update draft stage
      await dispatch(updateDraftStageSupabase({
        sessionId,
        draftId: selectedDraftId,
        stage: approvalAction,
        rejectionReason: approvalAction === 'rejected' ? rejectionReason : undefined,
        approvedBy: approvalAction === 'approved' ? 'Admin User' : undefined,
        rejectedBy: approvalAction === 'rejected' ? 'Admin User' : undefined
      })).unwrap();

      // Reset modal state on success
      setShowApprovalModal(false);
      setApprovalAction(null);
      setRejectionReason('');

    } catch (err) {
      console.error('Error updating draft stage:', err);
      // setError('Failed to update draft status');
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      'first_draft': 'info',
      'in_progress': 'warning',
      'pending_review': 'warning',
      'under_review': 'info',
      'pending_approval': 'warning',
      'approved': 'success',
      'rejected': 'danger'
    };
    return colors[stage] || 'secondary';
  };

  const getStageIcon = (stage) => {
    const icons = {
      'first_draft': FileText,
      'in_progress': Clock,
      'pending_review': Eye,
      'under_review': User,
      'pending_approval': AlertTriangle,
      'approved': CheckCircle,
      'rejected': XCircle
    };
    const IconComponent = icons[stage] || FileText;
    return <IconComponent size={16} />;
  };

  if (loading) {
    return (
      <div className="session-drafts">
        <div className="session-drafts__loading">
          <div className="spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-drafts">
        <div className="session-drafts__error">
          <AlertTriangle size={48} />
          <h2>{t('common.error')}</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/admin/sessions')} className="btn btn--primary">
            {t('common.goBack')}
          </button>
        </div>
      </div>
    );
  }

  if (!draft || !session) {
    return (
      <div className="session-drafts">
        <div className="session-drafts__not-found">
          <FileText size={48} />
          <h2>{t('admin.sessionDrafts.noDraftFound')}</h2>
          <p>{t('admin.sessionDrafts.noDraftDescription')}</p>
          <button onClick={() => navigate('/admin/sessions')} className="btn btn--primary">
            {t('common.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="session-drafts">
      {/* Header */}
      <div className="session-drafts__header">
        <div className="session-drafts__header-left">
          <button
            onClick={() => navigate('/admin/sessions')}
            className="btn btn--ghost session-drafts__back-btn"
          >
            <ArrowLeft size={20} />
            {t('common.back')}
          </button>
          <div className="session-drafts__title-section">
            <h1 className="session-drafts__title">{session?.client_name ? `${session.client_name}'s Life Story Draft` : 'Life Story Draft'}</h1>
            <div className="session-drafts__meta">
              <span className="session-drafts__client">
                <User size={16} />
                {session?.client_name || 'Unknown Client'}, {t('common.age')} {session?.client_age || 'N/A'}
              </span>
              <span className="session-drafts__version">
                {t('admin.sessionDrafts.version')} {draft.version}
              </span>
              <span className={`session-drafts__stage session-drafts__stage--${getStageColor(draft.stage)}`}>
                {getStageIcon(draft.stage)}
                {t(`admin.sessionDrafts.stages.${draft.stage}`)}
              </span>
            </div>
          </div>
        </div>

        <div className="session-drafts__header-actions">
          <button className="btn btn--primary">
            <Download size={16} />
            {t('admin.sessionDrafts.export')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="session-drafts__content">
        {/* Progress Overview */}
        <div className="session-drafts__progress-card">
          <h3>{t('admin.sessionDrafts.progress')}</h3>
          <div className="progress-bar">
            <div
              className="progress-bar__fill"
              style={{ width: `${draft.completion_percentage || 0}%` }}
            ></div>
          </div>
          <span className="progress-bar__text">{draft.completion_percentage || 0}% {t('common.complete')}</span>

          <div className="session-drafts__progress-details">
            <div className="session-drafts__interview-progress">
              <span>{session?.completedInterviews || draft.session_info?.completed_interviews || 0}/{session?.totalInterviews || draft.session_info?.total_interviews || 0} {t('admin.sessionDrafts.interviewsCompleted')}</span>
            </div>
            <div className="session-drafts__draft-progress">
              <span>{drafts.filter(d => d.stage === 'approved').length || 0}/{drafts.length || 0} {t('admin.sessionDrafts.draftsApproved')}</span>
            </div>
          </div>
        </div>

        <div className="session-drafts__main">
          {/* All Drafts for Session */}
          <div className="session-drafts__drafts-list">
            <h3>{t('admin.sessionDrafts.allDrafts')} ({drafts.length})</h3>

            {drafts.map((sessionDraft, index) => (
              <div key={sessionDraft.id} className="session-drafts__draft-card">
                <div className="session-drafts__draft-header">
                  <div className="session-drafts__draft-meta">
                    <span className="session-drafts__draft-interview">
                      {sessionDraft.interview_name || `${t('admin.sessionDrafts.interview')} #${sessionDraft.version || index + 1}`}
                    </span>
                    <span className={`session-drafts__draft-stage session-drafts__stage--${getStageColor(sessionDraft.stage)}`}>
                      {getStageIcon(sessionDraft.stage)}
                      {t(`admin.sessionDrafts.stages.${sessionDraft.stage}`)}
                    </span>
                    {/* <span className="session-drafts__draft-completion">
                      {sessionDraft.completion_percentage || 0}% {t('common.complete')} 
                      ({sessionDraft.session_info?.completed_interviews || 0}/{sessionDraft.session_info?.total_interviews || 0} interviews)
                    </span> */}
                    <span className="session-drafts__draft-date">
                      {new Date(sessionDraft.updated_at || sessionDraft.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    onClick={() => setEditingSection(editingSection === `draft-${sessionDraft.id}` ? null : `draft-${sessionDraft.id}`)}
                    className="btn btn--ghost btn--sm"
                  >
                    {editingSection === `draft-${sessionDraft.id}` ? (
                      <>
                        <Eye size={16} />
                        {t('common.collapse')}
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        {t('common.expand')}
                      </>
                    )}
                  </button>
                </div>

                {editingSection === `draft-${sessionDraft.id}` && (
                  <div className="session-drafts__draft-expanded">
                    {/* Draft Content */}
                    <div className="session-drafts__draft-content">
                      {/* Summary Section */}
                      {sessionDraft.content && sessionDraft.content.summary && (
                        <div className="session-drafts__content-section">
                          <h4>{t('admin.sessionDrafts.summary')}</h4>
                          <div className="session-drafts__content-text">
                            {sessionDraft.content.summary}
                          </div>
                        </div>
                      )}

                      {/* Key Themes */}
                      {sessionDraft.content && sessionDraft.content.key_themes && (
                        <div className="session-drafts__content-section">
                          <h4>{t('admin.sessionDrafts.keyThemes')}</h4>
                          <div className="session-drafts__themes-list">
                            {Array.isArray(sessionDraft.content.key_themes) ?
                              sessionDraft.content.key_themes.map((theme, idx) => (
                                <span key={idx} className="session-drafts__theme-tag">{theme}</span>
                              )) :
                              <span className="session-drafts__theme-tag">{sessionDraft.content.key_themes}</span>
                            }
                          </div>
                        </div>
                      )}

                      {/* Life Story Sections */}
                      {sessionDraft.content && sessionDraft.content.sections && (
                        <div className="session-drafts__content-section">
                          <h4>{t('admin.sessionDrafts.lifeStory')}</h4>
                          {Object.entries(sessionDraft.content.sections).map(([sectionKey, section]) => (
                            <div key={sectionKey} className="session-drafts__story-section">
                              <h5>{section.title || sectionKey}</h5>
                              <div className="session-drafts__story-content">
                                {typeof section === 'string' ? section : section.content || JSON.stringify(section)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Raw Content Fallback */}
                      {sessionDraft.content && !sessionDraft.content.sections && !sessionDraft.content.summary && (
                        <div className="session-drafts__content-section">
                          <h4>{t('admin.sessionDrafts.content')}</h4>
                          <div className="session-drafts__raw-content">
                            <pre>{JSON.stringify(sessionDraft.content, null, 2)}</pre>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Draft Sidebar - Notes & Info */}
                    <div className="session-drafts__draft-sidebar">
                      {/* Rejection Reason Display */}
                      {sessionDraft.stage === 'rejected' && sessionDraft.content?.rejection_metadata?.rejection_reason && (
                        <div className="session-drafts__rejection-section">
                          <h4>
                            <XCircle size={16} />
                            {t('admin.sessionDrafts.rejectionReason')}
                          </h4>
                          <div className="session-drafts__rejection-content">
                            <p>{sessionDraft.content.rejection_metadata.rejection_reason}</p>
                            <div className="session-drafts__rejection-meta">
                              <span>{t('admin.sessionDrafts.rejectedBy')}: {sessionDraft.content.rejection_metadata.rejected_by}</span>
                              <span>{t('admin.sessionDrafts.rejectedAt')}: {new Date(sessionDraft.content.rejection_metadata.rejected_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Approval Display */}
                      {sessionDraft.stage === 'approved' && sessionDraft.content?.approval_metadata && (
                        <div className="session-drafts__approval-section">
                          <h4>
                            <CheckCircle size={16} />
                            {t('admin.sessionDrafts.approvalInfo')}
                          </h4>
                          <div className="session-drafts__approval-content">
                            <div className="session-drafts__approval-meta">
                              <span>{t('admin.sessionDrafts.approvedByMeta')}: {sessionDraft.content.approval_metadata.approved_by}</span>
                              <span>{t('admin.sessionDrafts.approvedAt')}: {new Date(sessionDraft.content.approval_metadata.approved_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Draft Notes */}
                      <div className="session-drafts__notes-section">
                        <h4>
                          <MessageSquare size={16} />
                          {t('admin.sessionDrafts.notes')} ({sessionDraft.content?.notes?.length || 0})
                        </h4>

                        <div className="session-drafts__notes-list">
                          {sessionDraft.content?.notes && sessionDraft.content.notes.length > 0 ? (
                            sessionDraft.content.notes.map((note) => (
                              <div key={note.id} className="session-drafts__note">
                                <div className="session-drafts__note-header">
                                  <span className="session-drafts__note-author">{note.author}</span>
                                  <span className="session-drafts__note-date">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="session-drafts__note-content">
                                  {note.content}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="session-drafts__no-notes">
                              {t('admin.sessionDrafts.noNotes')}
                            </p>
                          )}
                        </div>

                        {/* Only show add note section if draft is not approved or rejected */}
                        {sessionDraft.stage !== 'approved' && sessionDraft.stage !== 'rejected' && (
                          <div className="session-drafts__add-note">
                            <textarea
                              placeholder={t('admin.sessionDrafts.addNotePlaceholder')}
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              rows={3}
                            />
                            <button
                              onClick={() => handleAddNote(sessionDraft.id)}
                              className="btn btn--primary btn--sm"
                              disabled={!newNote.trim() || loading}
                            >
                              <Plus size={16} />
                              {loading ? t('common.adding') : t('admin.sessionDrafts.addNote')}
                            </button>
                          </div>
                        )}

                        {/* Show disabled message for approved/rejected drafts */}
                        {(sessionDraft.stage === 'approved' || sessionDraft.stage === 'rejected') && (
                          <div className="session-drafts__disabled-message">
                            <p className="text-muted">
                              {sessionDraft.stage === 'approved' 
                                ? t('admin.sessionDrafts.noActionsApproved')
                                : t('admin.sessionDrafts.noActionsRejected')
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Approve/Reject Actions for this specific draft - only show if not already approved/rejected */}
                      {sessionDraft.stage !== 'approved' && sessionDraft.stage !== 'rejected' && (
                        <div className="session-drafts__draft-actions">
                          <button
                            onClick={() => handleApprovalAction('approved', sessionDraft.id)}
                            className="btn btn--success btn--sm"
                            disabled={loading}
                          >
                            <CheckCircle size={16} />
                            {loading ? t('common.approving') : t('admin.sessionDrafts.approve')}
                          </button>
                          <button
                            onClick={() => handleApprovalAction('rejected', sessionDraft.id)}
                            className="btn btn--danger btn--sm"
                            disabled={loading}
                          >
                            <XCircle size={16} />
                            {loading ? t('common.rejecting') : t('admin.sessionDrafts.reject')}
                          </button>
                        </div>
                      )}

                      {/* Draft Info */}
                      <div className="session-drafts__info-section">
                        <h4>
                          <FileText size={16} />
                          {t('admin.sessionDrafts.draftInfo')}
                        </h4>

                        <div className="session-drafts__info-item">
                          <Calendar size={16} />
                          <span className="session-drafts__info-label">{t('admin.sessionDrafts.created')}:</span>
                          <span>{new Date(sessionDraft.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="session-drafts__info-item">
                          <Calendar size={16} />
                          <span className="session-drafts__info-label">{t('admin.sessionDrafts.lastUpdated')}:</span>
                          <span>{new Date(sessionDraft.updated_at || sessionDraft.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="session-drafts__info-item">
                          <User size={16} />
                          <span className="session-drafts__info-label">{t('admin.sessionDrafts.author')}:</span>
                          <span>AI Generated</span>
                        </div>

                        <div className="session-drafts__info-item">
                          <Clock size={16} />
                          <span className="session-drafts__info-label">{t('admin.sessionDrafts.completion')}:</span>
                          <span>{sessionDraft.completion_percentage || 0}%</span>
                        </div>

                        {sessionDraft.overall_rating && (
                          <div className="session-drafts__info-item">
                            <span className="session-drafts__info-label">{t('admin.sessionDrafts.rating')}:</span>
                            <span>{sessionDraft.overall_rating}/5.0</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {drafts.length === 0 && (
              <div className="session-drafts__no-drafts">
                <FileText size={48} />
                <h3>{t('admin.sessionDrafts.noDrafts')}</h3>
                <p>{t('admin.sessionDrafts.noDraftsDescription')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>{t('admin.sessionDrafts.addNote')}</h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="modal__close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={t('admin.sessionDrafts.notePlaceholder')}
                className="form-control"
                rows={4}
              />
            </div>
            <div className="modal__footer">
              <button
                onClick={() => setShowNoteModal(false)}
                className="btn btn--ghost"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddNote}
                className="btn btn--primary"
                disabled={!newNote.trim()}
              >
                {t('admin.sessionDrafts.addNote')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3>
                {approvalAction === 'approved'
                  ? t('admin.sessionDrafts.approveDraft')
                  : t('admin.sessionDrafts.rejectDraft')
                }
              </h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="modal__close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal__body">
              {approvalAction === 'approved' ? (
                <p>{t('admin.sessionDrafts.approveConfirmation')}</p>
              ) : (
                <div>
                  <p>{t('admin.sessionDrafts.rejectConfirmation')}</p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={t('admin.sessionDrafts.rejectionReasonPlaceholder')}
                    className="form-control"
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>
            <div className="modal__footer">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="btn btn--ghost"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmApproval}
                className={`btn ${approvalAction === 'approved' ? 'btn--success' : 'btn--danger'}`}
                disabled={approvalAction === 'rejected' && !rejectionReason.trim()}
              >
                {approvalAction === 'approved'
                  ? t('admin.sessionDrafts.approve')
                  : t('admin.sessionDrafts.reject')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDrafts;
