import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import websocketService from '../../../services/websocketService';
import {
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
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
  Loader,
  Clock,
  Loader2
} from 'lucide-react';
import { addNoteToDraft, updateDraftStageSupabase } from '../../../store/slices/draftsSlice';
import ReactMarkdown from 'react-markdown';

const DraftViewModal = ({
  isOpen,
  onClose,
  draft,
  // interview,
  session,
  onRegenerate,
  onDraftUpdated, // New prop to refresh parent state
  onRegenerationError,
  onRefreshData, // New prop to refresh data without closing modal
  onRegenerationComplete, // New prop to handle regeneration completion
  loading = false
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // Custom close handler to ensure parent component is updated
  const handleClose = () => {
    // Always call onDraftUpdated when closing the modal to refresh parent state
    // This ensures notes count is updated in the interview list
    if (onDraftUpdated) {
      onDraftUpdated();
    }
    
    // Call the original onClose function
    onClose();
  };

  // Local state for notes editing
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [localDraft, setLocalDraft] = useState(null);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [regenerateReason, setRegenerateReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  // const [showRegenerateForm, setShowRegenerateForm] = useState(false);
  const [hasBeenRegenerated, setHasBeenRegenerated] = useState(false);
  const [notesAddedSinceRegeneration, setNotesAddedSinceRegeneration] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerationStep, setRegenerationStep] = useState(0);
  const [regenerationProgress, setRegenerationProgress] = useState(0);
  const [regenerationStage, setRegenerationStage] = useState('');
  
  // Flag to track if we're refreshing data due to notes being added
  // This prevents the notes flag from being reset during refresh
  const [isRefreshingAfterNotesAdded, setIsRefreshingAfterNotesAdded] = useState(false);

  // State for expandable sections
  const [sectionsExpanded, setSectionsExpanded] = useState(true); // Initially minimized
  const [followUpsExpanded, setFollowUpsExpanded] = useState(false); // Initially expanded

  // Regeneration processing steps
  const regenerationSteps = [
    { id: 'analyze', icon: FileSearch, title: t('admin.drafts.regeneration.analyzing', 'Analyzing Notes'), duration: 3000 },
    { id: 'process', icon: Brain, title: t('admin.drafts.regeneration.processing', 'AI Processing'), duration: 12000 },
    { id: 'enhance', icon: Wand2, title: t('admin.drafts.regeneration.enhancing', 'Enhancing Content'), duration: 8000 },
    { id: 'finalize', icon: Sparkles, title: t('admin.drafts.regeneration.finalizing', 'Finalizing Draft'), duration: 2000 }
  ];

  // Track if modal was previously open
  const wasOpen = useRef(false);
  
  // Use refs to keep track of the latest draft and session data
  // This ensures we always have the most up-to-date references after regeneration
  const draftRef = useRef(null);
  const sessionRef = useRef(null);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && draft) {
      // Reset form states
      setShowRejectionForm(false);
      // setShowRegenerateForm(false);
      setIsEditingNotes(false);
      setNewNoteContent('');
      
      // Check if this draft has been regenerated
      const isRegenerated = !!draft?.content?.metadata?.regenerationType;
      setHasBeenRegenerated(isRegenerated);
      
      // Only reset notesAddedSinceRegeneration when the modal first opens
      // Don't reset it when the draft changes while modal is already open
      if (!wasOpen.current) {
        setNotesAddedSinceRegeneration(false);
      }
    }
    
    // Track if modal was previously open
    wasOpen.current = isOpen;
  }, [isOpen, draft]);

  // Update local draft when parent draft changes
  useEffect(() => {
    if (draft) {
      // Update the draft ref to always have the latest version
      draftRef.current = draft;
      
      // Don't update localDraft if we just added notes and are refreshing
      // This prevents the notes from disappearing during refresh
      if (!isRefreshingAfterNotesAdded) {
        setLocalDraft(draft);
        
        // Reset regeneration state when new draft is received
        const isRegenerated = !!draft?.content?.metadata?.regenerationType;
        setHasBeenRegenerated(isRegenerated);
        
        // Only reset notes flag when we get a newly regenerated draft
        // This prevents the flag from being reset when notes are added
        if (isRegenerated && !notesAddedSinceRegeneration) {
          // Stop regeneration loading when new draft arrives
          setIsRegenerating(false);
        }
      }
    }
  }, [draft, notesAddedSinceRegeneration, isRefreshingAfterNotesAdded]);
  
  // Keep session ref updated
  useEffect(() => {
    if (session) {
      sessionRef.current = session;
    }
  }, [session]);

  // WebSocket listeners for regeneration events
  useEffect(() => {
    if (!isOpen || !draft?.id) return;

    // Connect to WebSocket
    websocketService.connect();

    // Listen for draft regeneration started
    const handleRegenerationStarted = (data) => {
      if (data.draftId === draft.id) {
        console.log('🔄 Regeneration started for draft:', data.draftId);
        setIsRegenerating(true);
        setRegenerationStep(0);
        setRegenerationProgress(0);
        setRegenerationStage('processing');
      }
    };

    // Listen for draft generation complete (includes regeneration)
    const handleDraftCompletion = (data) => {
      console.log('📝 Draft completion event received:', {
        draftId: data.draftId,
        sessionId: data.sessionId,
        isRegeneration: data.isRegeneration,
        currentlyRegenerating: isRegenerating
      });

      // Check if this completion event is for our current draft or session
      const isDraftMatch = data.draftId === draft?.id;
      const isSessionMatch = data.sessionId === session?.id;

      if (isDraftMatch || (isSessionMatch && (isRegenerating || data.isRegeneration))) {
        console.log('✅ Handling draft completion for our draft/session');

        // Stop regeneration animation
        setIsRegenerating(false);
        setRegenerationStage('completed');

        // Mark that regeneration has occurred
        setHasBeenRegenerated(true);
        
        // If we have the new draft data in the event, update our local state
        if (data.draft) {
          console.log('Updating local draft state with new draft data');
          setLocalDraft(data.draft);
          
          // Update our draft reference to ensure it's always current
          draftRef.current = data.draft;
          
          // Also update the draft prop reference if possible
          if (typeof draft === 'object') {
            Object.assign(draft, data.draft);
          }
        }

        // Close the modal after regeneration and trigger highlight animation
        setTimeout(() => {
          console.log('✅ Regeneration complete - closing modal and triggering highlight');
          
          // Notify parent about regeneration completion for highlight animation
          if (onRegenerationComplete) {
            onRegenerationComplete(data.draftId || draft?.id);
          }
          
          // Refresh the draft data to get the new version
          if (onDraftUpdated) {
            onDraftUpdated();
          }
          
          // Close the modal
          onClose();
        }, 2000);
      } else {
        console.log('🔍 Draft completion event not for our draft - ignoring');
      }
    };

    // Add WebSocket listeners
    if (websocketService.socket) {
      websocketService.socket.on('draft-regeneration-started', handleRegenerationStarted);
      websocketService.socket.on('draft-generation-complete', handleDraftCompletion);
    }

    // Cleanup on unmount or when modal closes
    return () => {
      if (websocketService.socket) {
        websocketService.socket.off('draft-regeneration-started', handleRegenerationStarted);
        websocketService.socket.off('draft-generation-complete', handleDraftCompletion);
      }
    };
  }, [isOpen, draft?.id, onDraftUpdated, onClose]);

  // Effect for regeneration steps - visual feedback only, doesn't control completion
  useEffect(() => {
    let progressInterval;
    let stepTimeout;

    if (isRegenerating && regenerationStage === 'processing') {
      const currentStepData = regenerationSteps[regenerationStep];
      if (!currentStepData) return;

      // Set up progress interval for current step
      progressInterval = setInterval(() => {
        setRegenerationProgress(prev => {
          const newProgress = prev + 2; // Slower progress
          return newProgress <= 100 ? newProgress : 100;
        });
      }, currentStepData.duration / 50); // Slower animation

      // Set up timeout for next step - but cycle through steps continuously
      stepTimeout = setTimeout(() => {
        if (regenerationStep < regenerationSteps.length - 1) {
          setRegenerationStep(prev => prev + 1);
          setRegenerationProgress(0);
        } else {
          // Cycle back to first step to keep animation going
          setRegenerationStep(0);
          setRegenerationProgress(0);
        }
      }, currentStepData.duration);
    }

    // Cleanup
    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (stepTimeout) clearTimeout(stepTimeout);
    };
  }, [isRegenerating, regenerationStep, regenerationSteps, regenerationStage]);

  // Effect to handle component unmounting or draft changes
  // This ensures regeneration state is reset if the component unmounts during regeneration
  useEffect(() => {
    return () => {
      // Reset regeneration state on unmount
      if (isRegenerating) {
        console.log('Resetting regeneration state on unmount or draft change');
        setIsRegenerating(false);
      }
    };
  }, [isRegenerating, draft?.id]);

  // Effect to force reset regeneration state after a timeout
  // This is a safety mechanism to ensure the modal doesn't stay open indefinitely
  // useEffect(() => {
  //   let safetyTimeout;

  //   if (isRegenerating) {
  //     // Set a safety timeout to force close the regeneration modal after 30 seconds
  //     // This ensures the modal doesn't stay open indefinitely if something goes wrong
  //     safetyTimeout = setTimeout(() => {
  //       console.log('Safety timeout triggered - forcing regeneration modal to close');
  //       setIsRegenerating(false);
  //     }, 1000000); // 100 seconds timeout
  //   }

  //   return () => {
  //     if (safetyTimeout) clearTimeout(safetyTimeout);
  //   };
  // }, [isRegenerating]);

  // Removed duplicate regeneration effect

  // Calculate overall regeneration progress
  const getOverallRegenerationProgress = () => {
    const stepProgress = (regenerationStep / regenerationSteps.length) * 100;
    const currentStepProgress = (regenerationProgress / regenerationSteps.length);
    return Math.min(stepProgress + currentStepProgress, 100);
  };

  if (!isOpen) return null;

  // Show loading state while fetching draft data
  if (!draft || (typeof draft === 'object' && draft.loading)) {
    return (
      <div className="draft-modal-overlay">
        <div className="draft-modal">
          <div className="draft-modal__header">
            <div className="draft-modal__title">
              <FileText size={24} />
              <h2>{t('admin.sessions.loadingDraft', 'Loading Draft...')}</h2>
            </div>
            <button className="btn btn--ghost" onClick={handleClose}>
              <X size={20} />
            </button>
          </div>
          <div className="draft-modal__content">
            <div className="loading-container">
              <Loader size={48} className="spinning" />
              <p>{t('admin.sessions.fetchingDraftData', 'Fetching draft data...')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveNotes = async () => {
    if (!newNoteContent.trim()) {
      return;
    }
    
    // Use the refs to ensure we have the most up-to-date draft and session data
    // This is crucial after regeneration when props might be stale
    const currentDraft = draftRef.current || draft;
    const currentSession = sessionRef.current || session;
    
    // Enhanced error checking for session and draft
    if (!currentSession?.id || !currentDraft?.id) {
      console.error('Cannot save note: session or draft is undefined', { currentSession, currentDraft });
      alert(t('admin.drafts.updateNotesError', 'Cannot save note: missing session or draft data'));
      return;
    }
    
    if (isSavingNote) {
      return;
    }

    setIsSavingNote(true);
    console.log('Saving note for draft:', currentDraft.id, 'session:', currentSession.id);

    try {
      const result = await dispatch(addNoteToDraft({
        sessionId: currentSession.id,
        draftId: currentDraft.id,
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

      // Mark that notes have been added since regeneration
      setNotesAddedSinceRegeneration(true);
      
      // Set flag to prevent local draft from being overwritten during refresh
      setIsRefreshingAfterNotesAdded(true);
      
      // Refresh data without closing modal when adding notes
      if (onRefreshData) {
        onRefreshData();
      }
      
      // Reset the refresh flag after a short delay
      // This allows the parent component to complete its refresh
      setTimeout(() => {
        setIsRefreshingAfterNotesAdded(false);
      }, 500);

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
    if (isFinalized) {
      alert(t('admin.drafts.alreadyFinalized', 'This draft has already been finalized'));
      return;
    }
    
    // Use the refs to ensure we have the most up-to-date draft and session data
    // This is crucial after regeneration when props might be stale
    const currentDraft = draftRef.current || draft;
    const currentSession = sessionRef.current || session;
    
    // Check if session and draft are defined before proceeding
    if (!currentSession?.id || !currentDraft?.id) {
      console.error('Cannot approve draft: session or draft is undefined', { currentSession, currentDraft });
      alert(t('admin.drafts.approveError', 'Cannot approve draft: missing session or draft data'));
      return;
    }

    try {
      await dispatch(updateDraftStageSupabase({
        sessionId: currentSession.id,
        draftId: currentDraft.id,
        stage: 'approved',
        approvedBy: 'Admin User'
      })).unwrap();

      // Close modal with our custom handler
      handleClose();
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
    
    // Use the refs to ensure we have the most up-to-date draft and session data
    const currentDraft = draftRef.current || draft;
    const currentSession = sessionRef.current || session;
    
    if (!currentDraft?.id) return;

    try {
      await dispatch(updateDraftStageSupabase({
        sessionId: currentSession.id,
        draftId: currentDraft.id,
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
      handleClose();
    } catch (error) {
      console.error('Failed to reject draft:', error);
      alert(t('admin.drafts.rejectError', 'Failed to reject draft'));
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      // Show initial loading state immediately
      setIsRegenerating(true);
      setRegenerationStep(0);
      setRegenerationProgress(0);
      setRegenerationStage('sending');

      // Use the ref to ensure we have the most up-to-date draft
      const currentDraft = draftRef.current || draft;

      try {
        // Call onRegenerate and handle the promise result
        const regeneratePromise = onRegenerate(currentDraft.id, regenerateReason);

        // If onRegenerate returns a promise, handle it
        if (regeneratePromise && typeof regeneratePromise.then === 'function') {
          regeneratePromise
            .then(() => {
              // API call succeeded - now waiting for WebSocket events
              console.log('📤 Regeneration request sent successfully');
              setRegenerationStage('sent');
              // WebSocket will handle the rest of the flow
              // DO NOT reset regeneration state here - wait for WebSocket completion
            })
            .catch(error => {
              // On error, reset regeneration state
              console.error('❌ Regeneration request failed:', error);
              setIsRegenerating(false);
              setRegenerationStage('');
              setRegenerateReason('');

              // Call the error callback if provided
              if (onRegenerationError) {
                onRegenerationError(error);
              }
            });
        } else {
          // If no promise is returned, assume it's synchronous and succeeded
          console.warn('onRegenerate did not return a promise');
          setRegenerationStage('sent');
        }
      } catch (error) {
        // Catch any synchronous errors
        console.error('Error in handleRegenerate:', error);
        setIsRegenerating(false);
        setRegenerationStage('');
        setRegenerateReason('');

        if (onRegenerationError) {
          onRegenerationError(error);
        }
      }

      // Clear the regenerate reason immediately when starting
      setRegenerateReason('');
    }

    // DO NOT reset regeneration state here - this should only happen in WebSocket completion handler
    // The WebSocket 'draft-generation-complete' event will handle:
    // - setHasBeenRegenerated(true)
    // - setNotesAddedSinceRegeneration(false)
    // - setIsRegenerating(false)
    // - onClose() after delay
  };

  const renderSections = () => {
    if (!draft.content?.sections) return null;

    // Handle different section formats
    if (Array.isArray(draft.content.sections)) {
      // Legacy array format
      return draft.content.sections.map((section, index) => (
        <div key={index} className="section-card">
          <h4 className="section-title">{section.title}</h4>
          <div className="section-content">
            {section.content}
          </div>
        </div>
      ));
    } else if (typeof draft.content.sections === 'object') {
      // New object format (could be from Hebrew AI or new markdown structure)
      return Object.entries(draft.content.sections).map(([sectionTitle, sectionContent]) => {
        // Check if content is a string or has nested structure
        const isHebrewContent = typeof sectionContent === 'string' &&
          (sectionContent.match(/[\u0590-\u05FF]/) || // Hebrew unicode range
            sectionTitle.match(/[\u0590-\u05FF]/)); // Hebrew in title

        return (
          <div key={sectionTitle} className="section-card">
            <h4 className="section-title">{sectionTitle}</h4>
            <div className={`section-content ${isHebrewContent ? 'hebrew-content' : ''}`}>
              {typeof sectionContent === 'string' ? (
                <ReactMarkdown>{sectionContent}</ReactMarkdown>
              ) : (
                // Handle nested content structure if present
                <div>
                  {sectionContent.content && (
                    <ReactMarkdown>{sectionContent.content}</ReactMarkdown>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      });
    }

    return null;
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

  // Get draft status from stage field - handle both draft table format and interview content format
  const draftStatus = draft?.stage || draft?.status || 'draft';
  const isFinalized = draftStatus === 'approved' || draftStatus === 'rejected';

  // Get approval/rejection metadata
  const approvalMetadata = draft?.content?.approval_metadata;
  const rejectionMetadata = draft?.content?.rejection_metadata;

  // Get notes from content.notes array
  const hasNewNotes = localDraft?.content?.notes && localDraft.content.notes.length > 0;

  const canApprove = !isFinalized;
  const canReject = false;
  // Can regenerate if: has notes AND not finalized AND not currently regenerating
  // Always allow regeneration if there are notes, regardless of regeneration history
  const canRegenerate = hasNewNotes && !isFinalized && !isRegenerating;
  const canEditNotes = !isFinalized;

  // console.log('Regenerate button state:', {
  //   hasNewNotes,
  //   isFinalized,
  //   isRegenerating,
  //   notesAddedSinceRegeneration,
  //   hasBeenRegenerated,
  //   canRegenerate
  // });

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
                <div className="loading-circle">
                  <RefreshCw size={24} />
                </div>
              </div>
            </div>

            {/* Current Step */}
            {/* <div className="regeneration-current-step">
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
            </div> */}

            {/* Steps Timeline */}
            {/* <div className="regeneration-steps-timeline">
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
            </div> */}

            <span className="regeneration-message">{t('admin.drafts.regenerationMsg', 'This process can take a few minutes. Please do not close the modal or navigate away from this page.')}</span>
          </div>
        </div>
      )}

      <div className="draft-modal-overlay" onClick={handleClose}>
        <div className="draft-modal" onClick={(e) => e.stopPropagation()}>
          <div className="draft-modal__header">
            <div className="draft-modal__title">
              <FileText size={24} />
              <div>
                <h2>{draft?.title || t('admin.sessions.draftDetails', 'Draft Details')} - {draft?.content?.title}</h2>
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
              <button className="btn btn--ghost" onClick={handleClose}>
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

              {/* Notes Section */}
              {!isFinalized && <div className="sidebar-section sidebar-section--notes">
                <div className="section-header">
                  <h4>
                    <MessageSquare size={16} />
                    {t('admin.drafts.notes', 'Instructions for regeneration')}
                  </h4>
                  {canEditNotes && (
                    <button
                      className="btn btn--ghost btn--sm"
                      onClick={() => setIsEditingNotes(!isEditingNotes)}
                    >
                      {isEditingNotes ? <X size={14} /> : <Edit3 size={14} />}
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
                      placeholder={t('admin.drafts.notesPlaceholder', 'Add instructions for regeneration...')}
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
                    <div className="no-notes" onClick={() => setIsEditingNotes(true)}>
                      <small>{t('admin.drafts.noNotes', 'No instructions added yet')}</small>
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
                  <div className="notes-info" onClick={() => setIsEditingNotes(!isEditingNotes)}>
                    <small>{t('admin.drafts.addNotesToRegenerate', 'Add instructions to enable draft regeneration')}</small>
                  </div>
                )}
              </div>}

              {hasNewNotes && canRegenerate && (
                <button
                  className="btn btn--sm btn-regenerate"
                  onClick={handleRegenerate}
                  disabled={loading}
                >
                  <RefreshCw size={14} />
                  {t('admin.drafts.regenerate', 'Regenerate')}
                </button>
              )}

              {/* Draft Info */}
              <div className="sidebar-section">
                <h4>
                  <Hash size={16} />
                  {t('admin.sessions.draftInfo', 'Draft Information')}
                </h4>
                <div className="info-list">
                  <div className="info-item">
                    <span>
                      {draft?.content?.metadata?.regenerationType && (
                        <span className="regenerated-badge">
                          {t('admin.drafts.regenerated', '🔄 Regenerated')}
                        </span>
                      )}
                    </span>
                    <label>{t('admin.sessions.draftVersion', 'Version')}: {(draft?.content?.metadata?.regenerationCount || 0) + 1}</label>
                  </div>
                  {/* {draft?.content?.metadata?.adminInstructions && (
                    <div className="info-item">
                      <label>{t('admin.drafts.regenerationInstructions', 'Regeneration Instructions')}</label>
                      <span className="regeneration-instructions">{draft.content.metadata.adminInstructions}</span>
                    </div>
                  )} */}
                  {/* <div className="info-item">
                    <label>{t('admin.sessions.regenerationTime', 'Regeneration Time')}</label>
                    <span>{draft?.content?.metadata?.regenerationTime ? new Date(draft.content.metadata.regenerationTime).toLocaleString() : 'N/A'}</span>
                  </div> */}
                  <div className="info-item">
                    <label>{t('admin.drafts.wordCount', 'Word Count')}</label>
                    <span>{draft?.content?.metadata?.wordCount || 0}</span>
                  </div>
                  {/* <div className="info-item">
                    <label>{t('admin.drafts.readingTime', 'Reading Time')}</label>
                    <span>
                      {draft?.content?.metadata?.estimatedReadingTime ||
                        (draft?.content?.metadata?.readingTime &&
                          `${draft.content.metadata.readingTime} ${t('admin.drafts.minutes', 'minutes')}`) ||
                        'N/A'}
                    </span>
                  </div> */}
                  {draft?.content?.metadata?.aiModel && (
                    <div className="info-item">
                      <label>{t('admin.drafts.aiModel', 'AI Model')}</label>
                      <span>{draft.content.metadata.aiModel}</span>
                    </div>
                  )}
                  {draft?.content?.metadata?.processedAt && (
                    <div className="info-item">
                      <label>{t('admin.drafts.processedAt', 'Processed At')}</label>
                      <span>
                        <Clock size={14} className="mr-1" />
                        {new Date(draft.content.metadata.processedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="draft-modal__main">
              {draft?.content && (
                <div className="draft-content">
                  {/* Display fullMarkdown if available, otherwise fall back to summary */}
                  {draft.content.fullMarkdown ? (
                    <div className="content-section">
                      <div className="section-header expandable-header">
                        <h3>{t('admin.sessions.fullContent', 'Full Content')}</h3>
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
                      {sectionsExpanded && <div className="content-text">
                        <ReactMarkdown>{draft.content.fullMarkdown}</ReactMarkdown>
                      </div>}
                    </div>
                  ) : draft.content.summary && (
                    <div className="content-section">
                      <h3>{t('admin.sessions.summary', 'Summary')}</h3>
                      <div className="content-text hebrew-content">
                        <ReactMarkdown>{draft.content.summary}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* Display sections */}
                  {!draft.content.fullMarkdown && draft.content.sections && (
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

                      {sectionsExpanded && <div className={`sections-grid`}>
                        {renderSections()}
                      </div>}
                    </div>
                  )}

                  {draft.content.followUps && Array.isArray(draft.content.followUps) && draft.content.followUps.length > 0 && (
                    <div className="content-section" onClick={() => console.log(draft)}>
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
                              <div className="follow-up-text hebrew-content">
                                <ReactMarkdown>{question}</ReactMarkdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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

                  {draft.content.toVerify && (() => {
                    // Normalize keys to lowercase for case-insensitive comparison
                    const toVerify = {};
                    Object.entries(draft.content.toVerify).forEach(([key, value]) => {
                      const normalizedKey = key.toLowerCase();
                      toVerify[normalizedKey] = value;
                    });

                    // Check if any verification categories have content
                    const hasVerificationData = Object.values(toVerify).some(
                      value => Array.isArray(value) && value.length > 0
                    );

                    if (hasVerificationData) {
                      return (
                        <div className="content-section">
                          <h3>{t('admin.drafts.toVerify', 'Information to Verify')}</h3>
                          <div className="to-verify-table">
                            <div className="table-grid">
                              {/* People */}
                              {(toVerify.people || toVerify.persons) &&
                                (toVerify.people?.length > 0 || toVerify.persons?.length > 0) && (
                                  <div className="table-column">
                                    <h4>{t('admin.drafts.people', 'People')}</h4>
                                    <ul className="verify-list">
                                      {(toVerify.people || toVerify.persons).map((person, index) => (
                                        <li key={index} className="hebrew-content">
                                          {typeof person === 'string' ? person :
                                            `${person.name || person.person || person.value} ${person.context ? `- ${person.context}` : ''}`}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                              {/* Places */}
                              {(toVerify.places || toVerify.locations) &&
                                (toVerify.places?.length > 0 || toVerify.locations?.length > 0) && (
                                  <div className="table-column">
                                    <h4>{t('admin.drafts.places', 'Places')}</h4>
                                    <ul className="verify-list">
                                      {(toVerify.places || toVerify.locations).map((place, index) => (
                                        <li key={index} className="hebrew-content">
                                          {typeof place === 'string' ? place :
                                            `${place.name || place.place || place.value} ${place.context || place.location ?
                                              `- ${place.context || place.location}` : ''}`}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                              {/* Organizations */}
                              {(toVerify.organizations || toVerify.organization || toVerify.orgs) &&
                                (toVerify.organizations?.length > 0 || toVerify.organization?.length > 0 || toVerify.orgs?.length > 0) && (
                                  <div className="table-column">
                                    <h4>{t('admin.drafts.organizations', 'Organizations')}</h4>
                                    <ul className="verify-list">
                                      {(toVerify.organizations || toVerify.organization || toVerify.orgs).map((org, index) => (
                                        <li key={index} className="hebrew-content">
                                          {typeof org === 'string' ? org :
                                            `${org.name || org.organization || org.value} ${org.context ? `- ${org.context}` : ''}`}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                              {/* Dates */}
                              {(toVerify.dates || toVerify.date || toVerify.events) &&
                                (toVerify.dates?.length > 0 || toVerify.date?.length > 0 || toVerify.events?.length > 0) && (
                                  <div className="table-column">
                                    <h4>{t('admin.drafts.dates', 'Dates')}</h4>
                                    <ul className="verify-list">
                                      {(toVerify.dates || toVerify.date || toVerify.events).map((date, index) => (
                                        <li key={index} className="hebrew-content">
                                          {typeof date === 'string' ? date :
                                            `${date.date || date.event || date.value} ${date.context ? `- ${date.context}` : ''}`}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
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
                  <p>{t('admin.drafts.rejectionExplanation', 'rejected drafts will not be used for full story generation, and will not be visible in the admin panel.')}</p>
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
          {/* {showRegenerateForm && (
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
                    disabled={loading || isRegenerating}
                  >
                    {isRegenerating ? (
                      <>
                        <Loader className="animate-spin" size={16} />
                        {regenerationStage === 'sending' ? 
                          t('admin.drafts.sending', 'Sending request...') :
                          regenerationStage === 'sent' ? 
                          t('admin.drafts.sent', 'Request sent, regenerating...') :
                          regenerationStage === 'processing' ? 
                          t('admin.drafts.processing', 'AI Processing...') : 
                          regenerationStage === 'completed' ?
                          t('admin.drafts.completed', 'Completed!') :
                          t('admin.drafts.regenerating', 'Regenerating...')
                        }
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        {t('admin.drafts.regenerateDraft', 'Regenerate Draft')}
                      </>
                    )}
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
          )} */}
        </div>
      </div>
    </>
  );
};

export default DraftViewModal;
