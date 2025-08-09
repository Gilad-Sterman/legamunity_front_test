import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDraftsBySession, updateDraftContent, updateDraftStage } from '../../store/slices/draftsSlice';
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
import DraftMigration from './DraftMigration';

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

  // Get current session and draft from Redux state
  const session = sessions.find(s => s.id === sessionId);
  const draft = drafts.length > 0 ? drafts[0] : null; // Get the latest draft (first in sorted array)

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
      const note = {
        id: `note-${Date.now()}`,
        content: newNote,
        author: 'Admin User', // In production, get from auth state
        createdAt: new Date().toISOString(),
        draftId: draftId
      };

      // TODO: Implement draft-specific notes storage
      // For now, just clear the input
      setNewNote('');
      console.log('Note added for draft:', draftId, note);
    } catch (err) {
      console.error('Error adding note:', err);
      // setError('Failed to add note');
    }
  };

  const handleApprovalAction = async (action) => {
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    try {
      let newStage;
      const updateData = {
        stage: approvalAction,
        updatedAt: new Date().toISOString()
      };

      if (approvalAction === 'approved') {
        newStage = 'approved';
        updateData.approvedBy = 'Admin User'; // In production, get from auth state
        updateData.approvedAt = new Date().toISOString();
      } else if (approvalAction === 'rejected') {
        newStage = 'rejected';
        updateData.rejectedBy = 'Admin User';
        updateData.rejectedAt = new Date().toISOString();
        updateData.rejectionReason = rejectionReason;
      }

      const updatedDraft = { ...draft, ...updateData, stage: newStage };
      // setDraft(updatedDraft);

      setShowApprovalModal(false);
      setApprovalAction(null);
      setRejectionReason('');

      // In production, dispatch API call
      // dispatch(updateDraftStage({ draftId: draft.id, stage: newStage, reason: rejectionReason }));

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
        <DraftMigration />
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
          {/* <button 
            onClick={() => setShowNoteModal(true)}
            className="btn btn--secondary"
          >
            <Plus size={16} />
            {t('admin.sessionDrafts.addNote')}
          </button> */}

          {/* {draft.stage === 'pending_review' && (
            <>
              <button 
                onClick={() => handleApprovalAction('approved')}
                className="btn btn--success"
              >
                <CheckCircle size={16} />
                {t('admin.sessionDrafts.approve')}
              </button>
              <button 
                onClick={() => handleApprovalAction('rejected')}
                className="btn btn--danger"
              >
                <XCircle size={16} />
                {t('admin.sessionDrafts.reject')}
              </button>
            </>
          )} */}

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

          <div className="session-drafts__interview-progress">
            <span>{session?.completedInterviews || 0}/{session?.totalInterviews || 0} {t('admin.sessionDrafts.interviewsCompleted')}</span>
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
                      {t('admin.sessionDrafts.interview')} #{sessionDraft.version || index + 1}
                    </span>
                    <span className={`session-drafts__draft-stage session-drafts__stage--${getStageColor(sessionDraft.stage)}`}>
                      {getStageIcon(sessionDraft.stage)}
                      {t(`admin.sessionDrafts.stages.${sessionDraft.stage}`)}
                    </span>
                    <span className="session-drafts__draft-completion">
                      {sessionDraft.completion_percentage || 0}% {t('common.complete')}
                    </span>
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
                      {/* Draft Notes */}
                      <div className="session-drafts__notes-section">
                        <h4>
                          <MessageSquare size={16} />
                          {t('admin.sessionDrafts.notes')} (0)
                        </h4>

                        <div className="session-drafts__notes-list">
                          {/* Notes would go here - currently empty */}
                        </div>

                        <div className="session-drafts__add-note">
                          <textarea
                            placeholder={t('admin.sessionDrafts.addNotePlaceholder')}
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                          />
                          <button
                            onClick={() => handleAddNote(sessionDraft.id)}
                            className="btn btn--primary btn--sm"
                            disabled={!newNote.trim()}
                          >
                            <Plus size={16} />
                            {t('admin.sessionDrafts.addNote')}
                          </button>
                        </div>
                      </div>

                      {sessionDraft.stage === 'pending_review' && (
                        <>
                          <button
                            onClick={() => handleApprovalAction('approved')}
                            className="btn btn--success"
                          >
                            <CheckCircle size={16} />
                            {t('admin.sessionDrafts.approve')}
                          </button>
                          <button
                            onClick={() => handleApprovalAction('rejected')}
                            className="btn btn--danger"
                          >
                            <XCircle size={16} />
                            {t('admin.sessionDrafts.reject')}
                          </button>
                        </>
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



          {/* Sidebar - Notes */}
          <div className="session-drafts__sidebar">
            <div className="session-drafts__notes-section">
              <h3>
                <MessageSquare size={20} />
                {t('admin.sessionDrafts.notes')} (0)
              </h3>

              {/* <div className="session-drafts__notes-list">
                {notes.map((note) => (
                  <div key={note.id} className="session-drafts__note">
                    <div className="session-drafts__note-header">
                      <span className="session-drafts__note-author">{note.author}</span>
                      <span className="session-drafts__note-date">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="session-drafts__note-content">{note.content}</p>
                  </div>
                ))}
                
                {notes.length === 0 && (
                  <p className="session-drafts__no-notes">
                    {t('admin.sessionDrafts.noNotes')}
                  </p>
                )}
              </div> */}
            </div>

            {/* Draft Info */}
            <div className="session-drafts__info-section">
              <h3>{t('admin.sessionDrafts.draftInfo')}</h3>
              <div className="session-drafts__info-item">
                <Calendar size={16} />
                <span className="session-drafts__info-label">{t('admin.sessionDrafts.created')}:</span>
                <span>{new Date(draft.created_at).toLocaleDateString()}</span>
              </div>
              <div className="session-drafts__info-item">
                <Calendar size={16} />
                <span className="session-drafts__info-label">{t('admin.sessionDrafts.lastUpdated')}:</span>
                <span>{new Date(draft.updated_at || draft.created_at).toLocaleDateString()}</span>
              </div>
              <div className="session-drafts__info-item">
                <User size={16} />
                <span className="session-drafts__info-label">{t('admin.sessionDrafts.author')}:</span>
                <span>AI Generated</span>
              </div>
              <div className="session-drafts__info-item">
                <Clock size={16} />
                <span className="session-drafts__info-label">{t('admin.sessionDrafts.completion')}:</span>
                <span>{draft.completion_percentage || 0}%</span>
              </div>
              {draft.overall_rating && (
                <div className="session-drafts__info-item">
                  <span className="session-drafts__info-label">{t('admin.sessionDrafts.rating')}:</span>
                  <span>{draft.overall_rating}/5.0</span>
                </div>
              )}
            </div>
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
