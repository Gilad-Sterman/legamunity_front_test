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
  ChevronDown,
  ChevronUp,
  Brain,
  Wand2,
  FileSearch,
  Sparkles,
  Loader
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
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [localDraft, setLocalDraft] = useState(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [regenerateReason, setRegenerateReason] = useState('');
  const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [hasBeenRegenerated, setHasBeenRegenerated] = useState(false);
  const [notesAddedSinceRegeneration, setNotesAddedSinceRegeneration] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationStep, setRegenerationStep] = useState(0);
  const [regenerationProgress, setRegenerationProgress] = useState(0);
  
  // State for expandable sections
  const [sectionsExpanded, setSectionsExpanded] = useState(false); // Initially minimized
  const [followUpsExpanded, setFollowUpsExpanded] = useState(true); // Initially expanded

  // Regeneration processing steps
  const regenerationSteps = [
    { id: 'analyze', icon: FileSearch, title: t('admin.drafts.regeneration.analyzing', 'Analyzing Notes'), duration: 3000 },
    { id: 'process', icon: Brain, title: t('admin.drafts.regeneration.processing', 'AI Processing'), duration: 12000 },
    { id: 'enhance', icon: Wand2, title: t('admin.drafts.regeneration.enhancing', 'Enhancing Content'), duration: 8000 },
    { id: 'finalize', icon: Sparkles, title: t('admin.drafts.regeneration.finalizing', 'Finalizing Draft'), duration: 2000 }
  ];

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && draft) {
      setLocalDraft(draft);
      setNewNoteContent('');
      setIsEditingNotes(false);
      setShowRegenerateForm(false);
      setShowRejectionForm(false);
      setRegenerateReason('');
      setRejectionReason('');
      // Check if this draft has been regenerated
      const isRegenerated = !!draft?.content?.metadata?.regenerationType;
      setHasBeenRegenerated(isRegenerated);
      setNotesAddedSinceRegeneration(false);
    }
  }, [isOpen, draft]);

  // Update local draft when parent draft changes
  useEffect(() => {
    if (draft) {
      setLocalDraft(draft);
      // Reset regeneration state when new draft is received
      const isRegenerated = !!draft?.content?.metadata?.regenerationType;
      setHasBeenRegenerated(isRegenerated);
      // Reset notes flag when we get a regenerated draft
      if (isRegenerated) {
        setNotesAddedSinceRegeneration(false);
        // Stop regeneration loading when new draft arrives
        setIsRegenerating(false);
      }
    }
  }, [draft]);

  // Regeneration progress animation
  useEffect(() => {
    let progressInterval;
    let stepTimeout;

    if (isRegenerating) {
      const currentStepData = regenerationSteps[regenerationStep];
      if (!currentStepData) return;

      // Animate progress within current step
      progressInterval = setInterval(() => {
        setRegenerationProgress(prev => {
          const increment = 100 / (currentStepData.duration / 100);
          return Math.min(prev + increment, 100);
        });
      }, 100);

      // Move to next step after duration
      stepTimeout = setTimeout(() => {
        if (regenerationStep < regenerationSteps.length - 1) {
          setRegenerationStep(prev => prev + 1);
          setRegenerationProgress(0);
        }
      }, currentStepData.duration);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (stepTimeout) clearTimeout(stepTimeout);
    };
  }, [isRegenerating, regenerationStep, regenerationSteps]);

  // Calculate overall regeneration progress
  const getOverallRegenerationProgress = () => {
    const stepProgress = (regenerationStep / regenerationSteps.length) * 100;
    const currentStepProgress = (regenerationProgress / regenerationSteps.length);
    return Math.min(stepProgress + currentStepProgress, 100);
  };

  if (!isOpen || !draft) return null;

  const handleSaveNotes = async () => {
    if (!newNoteContent.trim() || !draft?.id || !session?.id || isSavingNote) return;
    
    setIsSavingNote(true);
    
    try {
      const result = await dispatch(addNoteToDraft({
        sessionId: session.id,
        draftId: draft.id,
        content: newNoteContent.trim(),
        author: 'Admin User' // In production, get from auth state
      })).unwrap();
      
      // Update local draft immediately with the new note
      const newNote = {
        id: Date.now().toString(),
        content: newNoteContent.trim(),
        author: 'Admin User',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toLocaleString()
      };
      
      setLocalDraft(prevDraft => ({
        ...prevDraft,
        content: {
          ...prevDraft.content,
          notes: [newNote, ...(prevDraft.content?.notes || [])]
        }
      }));
      
      // Refresh parent state
      if (onDraftUpdated) {
        onDraftUpdated();
      }
      
      // Mark that notes have been added since regeneration
      setNotesAddedSinceRegeneration(true);
      
      setNewNoteContent('');
      setIsEditingNotes(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert(t('admin.drafts.updateNotesError', 'Failed to update draft notes'));
    } finally {
      setIsSavingNote(false);
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
      setIsRegenerating(true);
      setRegenerationStep(0);
      setRegenerationProgress(0);
      onRegenerate(draft.id, regenerateReason);
    }
    setShowRegenerateForm(false);
    setRegenerateReason('');
    // Mark that regeneration has occurred and reset notes flag
    setHasBeenRegenerated(true);
    setNotesAddedSinceRegeneration(false);
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
  const hasNewNotes = localDraft?.content?.notes && localDraft.content.notes.length > 0;
  
  const canApprove = !isFinalized;
  const canReject = !isFinalized;
  // Can regenerate if: has notes AND not finalized AND (not regenerated OR notes added since regeneration)
  const canRegenerate = hasNewNotes && !isFinalized && (!hasBeenRegenerated || notesAddedSinceRegeneration);
  const canEditNotes = !isFinalized;

  return (
    <>
      {/* Regeneration Processing Overlay */}
      {isRegenerating && (
        <div className="draft-modal__regeneration-overlay">
          <div className="draft-modal__regeneration-content">
            {/* Overall Progress */}
            <div className="regeneration-header">
              <h3>{t('admin.drafts.regeneration.title', 'Regenerating Draft')}</h3>
              <div className="regeneration-overall-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getOverallRegenerationProgress()}%` }}
                  />
                </div>
                <span className="progress-text">{Math.round(getOverallRegenerationProgress())}%</span>
              </div>
            </div>

            {/* Current Step */}
            <div className="regeneration-current-step">
              <div className="step-icon-container">
                {React.createElement(regenerationSteps[regenerationStep]?.icon || Loader, {
                  size: 64,
                  className: "step-icon animate-pulse"
                })}
              </div>
              <div className="step-info">
                <h4 className="step-title">{regenerationSteps[regenerationStep]?.title}</h4>
                <div className="step-progress">
                  <div className="step-progress-bar">
                    <div 
                      className="step-progress-fill" 
                      style={{ width: `${regenerationProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="regeneration-steps-timeline">
              {regenerationSteps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`timeline-step ${index <= regenerationStep ? 'completed' : ''} ${index === regenerationStep ? 'active' : ''}`}
                >
                  <div className="timeline-step-icon">
                    {React.createElement(step.icon, { size: 16 })}
                  </div>
                  <span className="timeline-step-title">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
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
            {hasNewNotes && canRegenerate && (
              <button 
                className="btn btn--warning btn--sm"
                onClick={() => setShowRegenerateForm(true)}
                disabled={loading}
              >
                <RefreshCw size={14} />
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
                    <><CheckCircle size={16} /> {t('admin.drafts.approvalInfo', 'Approval Info')}</>
                  ) : (
                    <><XCircle size={16} /> {t('admin.drafts.rejectionInfo', 'Rejection Info')}</>
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
                  <span>
                    {draft?.version || 1}
                    {draft?.content?.metadata?.regenerationType && (
                      <span className="regenerated-badge">
                        {t('admin.drafts.regenerated', '(Regenerated)')}
                      </span>
                    )}
                  </span>
                </div>
                {draft?.content?.metadata?.regeneratedFrom && (
                  <div className="info-item">
                    <label>{t('admin.drafts.regeneratedFrom', 'Regenerated From')}</label>
                    <span>Version {draft.content.metadata.regeneratedFrom}</span>
                  </div>
                )}
                {draft?.content?.metadata?.adminInstructions && (
                  <div className="info-item">
                    <label>{t('admin.drafts.regenerationInstructions', 'Regeneration Instructions')}</label>
                    <span className="regeneration-instructions">{draft.content.metadata.adminInstructions}</span>
                  </div>
                )}
                <div className="info-item">
                  <label>{t('admin.sessions.createdAt', 'Created At')}</label>
                  <span>{draft?.createdAt ? new Date(draft.createdAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>{t('admin.drafts.wordCount', 'Word Count')}</label>
                  <span>{draft?.content?.metadata?.wordCount || 0}</span>
                </div>
                <div className="info-item">
                  <label>{t('admin.drafts.readingTime', 'Reading Time')}</label>
                  <span>{draft?.content?.metadata?.estimatedReadingTime || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>{t('admin.drafts.aiModel', 'AI Model')}</label>
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
                {canEditNotes && (
                  <button 
                    className="btn btn--ghost btn--sm"
                    onClick={() => setIsEditingNotes(!isEditingNotes)}
                  >
                    <Edit3 size={14} />
                    {isEditingNotes ? t('common.cancel', 'Cancel') : t('admin.drafts.addNote', 'Add Note')}
                  </button>
                )}
              </div>
              
              {/* Add New Note Form */}
              {isEditingNotes && canEditNotes && (
                <div className="add-note-form">
                  <textarea
                    className="notes-textarea"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder={t('admin.drafts.notesPlaceholder', 'Add notes about this draft...')}
                    rows={4}
                  />
                  <div className="notes-actions">
                    <button 
                      className="btn btn--success btn--sm"
                      onClick={handleSaveNotes}
                      disabled={isSavingNote || !newNoteContent.trim()}
                    >
                      {isSavingNote ? (
                        <>
                          <RefreshCw size={14} className="spinning" />
                          {t('common.saving', 'Saving...')}
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          {t('common.save', 'Save')}
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn--ghost btn--sm"
                      onClick={() => {
                        setIsEditingNotes(false);
                        setNewNoteContent('');
                      }}
                    >
                      <X size={14} />
                      {t('common.cancel', 'Cancel')}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Existing Notes Display */}
              <div className="notes-list">
                {localDraft?.content?.notes && localDraft.content.notes.length > 0 ? (
                  localDraft.content?.notes.map((note, index) => (
                    <div key={note.id || index} className="note-item">
                      <div className="note-header">
                        <span className="note-author">{note.author || 'Admin User'}</span>
                        <span className="note-date">
                          {note.timestamp || (note.createdAt ? new Date(note.createdAt).toLocaleString() : new Date().toLocaleString())}
                        </span>
                      </div>
                      <div className="note-content">{note.content || note}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-notes">
                    <small>{t('admin.drafts.noNotes', 'No notes added yet')}</small>
                  </div>
                )}
              </div>
              
              {/* Info Messages */}
              {!canEditNotes && (
                <div className="notes-disabled-info">
                  <small>{t('admin.drafts.notesDisabled', 'Notes cannot be edited for approved/rejected drafts')}</small>
                </div>
              )}
              {canEditNotes && (!localDraft?.content?.notes || localDraft.content.notes.length === 0) && !isEditingNotes && (
                <div className="notes-info">
                  <small>{t('admin.drafts.addNotesToRegenerate', 'Add notes to enable draft regeneration')}</small>
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
                
                {draft.content.sections && (
                  <div className="content-section">
                    <div className="section-header expandable-header">
                      <h3>{t('admin.sessions.sections', 'Sections')}</h3>
                      <button 
                        className="btn btn--ghost btn--sm expand-toggle"
                        onClick={() => setSectionsExpanded(!sectionsExpanded)}
                      >
                        {sectionsExpanded ? (
                          <>
                            <ChevronUp size={16} />
                            {t('admin.drafts.showLess', 'Show Less')}
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            {t('admin.drafts.showMore', 'Show More')}
                          </>
                        )}
                      </button>
                    </div>
                    {sectionsExpanded && (
                      <div className="sections-grid">
                        {renderSections()}
                      </div>
                    )}
                  </div>
                )}
                
                {draft.content.followUps && Array.isArray(draft.content.followUps) && draft.content.followUps.length > 0 && (
                  <div className="content-section">
                    <div className="section-header expandable-header">
                      <h3>{t('admin.drafts.followUps', 'Follow-up Questions')}</h3>
                      <button 
                        className="btn btn--ghost btn--sm expand-toggle"
                        onClick={() => setFollowUpsExpanded(!followUpsExpanded)}
                      >
                        {followUpsExpanded ? (
                          <>
                            <ChevronUp size={16} />
                            {t('admin.drafts.showLess', 'Show Less')}
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            {t('admin.drafts.showMore', 'Show More')}
                          </>
                        )}
                      </button>
                    </div>
                    {followUpsExpanded && (
                      <div className="follow-ups-list">
                        {draft.content.followUps.map((question, index) => (
                          <div key={index} className="follow-up-item">
                            <span className="follow-up-number">{index + 1}.</span>
                            <span className="follow-up-text hebrew-content">{question}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {draft.content.toVerify && Object.keys(draft.content.toVerify).some(key => 
                  Array.isArray(draft.content.toVerify[key]) && draft.content.toVerify[key].length > 0
                ) && (
                  <div className="content-section">
                    <h3>{t('admin.drafts.toVerify', 'Information to Verify')}</h3>
                    <div className="to-verify-table">
                      <div className="table-grid">
                        {draft.content.toVerify.people && draft.content.toVerify.people.length > 0 && (
                          <div className="table-column">
                            <h4>{t('admin.drafts.people', 'People')}</h4>
                            <ul className="verify-list">
                              {draft.content.toVerify.people.map((person, index) => (
                                <li key={index} className="hebrew-content">
                                  {typeof person === 'string' ? person : `${person.name} - ${person.context}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {draft.content.toVerify.places && draft.content.toVerify.places.length > 0 && (
                          <div className="table-column">
                            <h4>{t('admin.drafts.places', 'Places')}</h4>
                            <ul className="verify-list">
                              {draft.content.toVerify.places.map((place, index) => (
                                <li key={index} className="hebrew-content">
                                  {typeof place === 'string' ? place : `${place.name} - ${place.location || place.context}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {draft.content.toVerify.organizations && draft.content.toVerify.organizations.length > 0 && (
                          <div className="table-column">
                            <h4>{t('admin.drafts.organizations', 'Organizations')}</h4>
                            <ul className="verify-list">
                              {draft.content.toVerify.organizations.map((org, index) => (
                                <li key={index} className="hebrew-content">
                                  {typeof org === 'string' ? org : `${org.name} - ${org.context}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {draft.content.toVerify.dates && draft.content.toVerify.dates.length > 0 && (
                          <div className="table-column">
                            <h4>{t('admin.drafts.dates', 'Dates')}</h4>
                            <ul className="verify-list">
                              {draft.content.toVerify.dates.map((date, index) => (
                                <li key={index} className="hebrew-content">
                                  {typeof date === 'string' ? date : `${date.date} - ${date.context}`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
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
                <h4>{t('admin.drafts.reject', 'Reject Draft')}</h4>
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
                  {t('admin.drafts.reject', 'Confirm Rejection')}
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
                  {t('admin.drafts.regenerateDraft', 'Regenerate Draft')}
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
    </>
  );
};

export default DraftViewModal;
