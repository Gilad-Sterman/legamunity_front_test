import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, X, FileText, Music, AlertCircle, CheckCircle, Loader, Brain, Wand2, FileSearch, Sparkles, Clock } from 'lucide-react';
import { uploadInterviewFile } from '../../../store/slices/interviewsSlice';
import { uploadInterviewFileAsync, fetchSessionById } from '../../../store/slices/sessionsSliceSupabase';
import websocketService from '../../../services/websocketService';

const FileUpload = ({ interviewId, sessionData, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { uploadLoading } = useSelector(state => state.interviews);
  const { uploadLoading: asyncUploadLoading } = useSelector(state => state.sessionsSupabase || {});

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [uploadMessage, setUploadMessage] = useState('');
  const [asyncUploadStatus, setAsyncUploadStatus] = useState(null); // 'success', 'error', null
  const [asyncUploadMessage, setAsyncUploadMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [asyncProcessingStage, setAsyncProcessingStage] = useState('transcribing'); // 'uploading', 'transcribing', 'generating_draft', 'completed'
  const [showAsyncModal, setShowAsyncModal] = useState(true);

  const fileInputRef = useRef(null);

  // Processing steps configuration (static to avoid useEffect re-runs)
  const processingStepsConfig = [
    { id: 'upload', icon: Upload, duration: 2000 },
    { id: 'analyze', icon: FileSearch, duration: 3000 },
    { id: 'transcribe', icon: Wand2, duration: 8000 },
    { id: 'process', icon: Brain, duration: 10000 },
    { id: 'finalize', icon: Sparkles, duration: 2000 }
  ];

  // Async processing stages configuration
  const asyncStagesConfig = [
    {
      id: 'uploading',
      icon: Upload,
      title: t('admin.interviews.async.uploading.title', 'Uploading to Cloud'),
      description: t('admin.interviews.async.uploading.description', 'Securely transferring your file to cloud storage')
    },
    {
      id: 'transcribing',
      icon: Wand2,
      title: t('admin.interviews.async.transcribing.title', 'AI Transcription'),
      description: t('admin.interviews.async.transcribing.description', 'Converting audio to text using advanced AI')
    },
    {
      id: 'generating_draft',
      icon: Brain,
      title: t('admin.interviews.async.generating.title', 'Generating Draft Based on Interview'),
      description: t('admin.interviews.async.generating.description', 'AI is creating your draft based on the interview')
    },
    {
      id: 'completed',
      icon: CheckCircle,
      title: t('admin.interviews.async.completed.title', 'Processing Complete'),
      description: t('admin.interviews.async.completed.description', 'Your interview has been fully processed')
    }
  ];

  // Get localized processing steps
  const getProcessingSteps = () => [
    {
      ...processingStepsConfig[0],
      title: t('admin.interviews.upload.steps.uploading', 'Uploading File'),
      description: t('admin.interviews.upload.steps.uploadingDesc', 'Securely transferring your file to our servers'),
      tip: t('admin.interviews.upload.tips.upload', '💡 Tip: Our servers use enterprise-grade encryption to keep your files secure')
    },
    {
      ...processingStepsConfig[1],
      title: t('admin.interviews.upload.steps.analyzing', 'Analyzing Content'),
      description: t('admin.interviews.upload.steps.analyzingDesc', 'Examining file structure and preparing for processing'),
      tip: t('admin.interviews.upload.tips.analyze', '🔍 Did you know? We can process over 50 different audio formats')
    },
    {
      ...processingStepsConfig[2],
      title: t('admin.interviews.upload.steps.transcribing', 'AI Transcription'),
      description: t('admin.interviews.upload.steps.transcribingDesc', 'Converting audio to text using advanced AI models'),
      tip: t('admin.interviews.upload.tips.transcribe', '🎯 Our AI achieves 95%+ accuracy in speech recognition')
    },
    {
      ...processingStepsConfig[3],
      title: t('admin.interviews.upload.steps.processing', 'AI Processing'),
      description: t('admin.interviews.upload.steps.processingDesc', 'Extracting insights and generating life story draft'),
      tip: t('admin.interviews.upload.tips.process', '🧠 AI is identifying key life moments and themes in your story')
    },
    {
      ...processingStepsConfig[4],
      title: t('admin.interviews.upload.steps.finalizing', 'Finalizing'),
      description: t('admin.interviews.upload.steps.finalizingDesc', 'Completing processing and preparing results'),
      tip: t('admin.interviews.upload.tips.finalize', '✨ Almost done! Preparing your personalized life story draft')
    }
  ];

  // Supported file types
  const supportedTypes = {
    audio: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'flac'],
    text: ['txt', 'md', 'pdf', 'doc', 'docx']
  };

  const allSupportedTypes = [...supportedTypes.audio, ...supportedTypes.text];

  // WebSocket setup for real-time updates
  useEffect(() => {
    // Connect to WebSocket when component mounts
    websocketService.connect();

    return () => {
      // Clean up WebSocket connection when component unmounts
      if (interviewId) {
        websocketService.offInterviewStatusUpdate(interviewId);
      }
    };
  }, []);

  // Set up WebSocket listener for interview status updates
  useEffect(() => {
    if (interviewId && showAsyncModal) {
      const handleStatusUpdate = (data) => {
        const { status, error_message } = data;

        console.log('📡 FileUpload received status update:', status);

        switch (status) {
          case 'uploading':
            setAsyncProcessingStage('uploading');
            setAsyncUploadStatus('uploading');
            break;

          case 'transcribing':
            setAsyncProcessingStage('transcribing');
            setAsyncUploadStatus('processing');
            break;

          case 'generating_draft':
            setAsyncProcessingStage('generating_draft');
            setAsyncUploadStatus('processing');
            break;

          case 'completed':
            setAsyncProcessingStage('completed');
            setAsyncUploadStatus('success');
            setAsyncUploadMessage('Interview processed successfully!');

            // Refresh session data to show updated interview
            if (sessionData?.id) {
              dispatch(fetchSessionById(sessionData.id));
            }

            // Close modal after a brief delay to show success message
            setTimeout(() => {
              setShowAsyncModal(false);
              if (onSuccess) onSuccess();
            }, 2000);
            break;

          case 'error':
            setAsyncProcessingStage('error');
            setAsyncUploadStatus('error');
            setAsyncUploadMessage(error_message || 'Processing failed. Please try again.');

            // Close modal after showing error for a few seconds
            setTimeout(() => {
              setShowAsyncModal(false);
            }, 4000);
            break;
        }
      };

      websocketService.onInterviewStatusUpdate(interviewId, handleStatusUpdate);

      return () => {
        websocketService.offInterviewStatusUpdate(interviewId, handleStatusUpdate);
      };
    }
  }, [interviewId, showAsyncModal, dispatch, sessionData?.id]);

  // Progress animation effect
  useEffect(() => {
    let progressInterval;
    let stepTimeout;

    if (uploadLoading) {
      const currentStepData = processingStepsConfig[currentStep];
      if (!currentStepData) return;

      // Animate progress within current step
      progressInterval = setInterval(() => {
        setProgress(prev => {
          const increment = 100 / (currentStepData.duration / 100);
          return Math.min(prev + increment, 100);
        });
      }, 100);

      // Move to next step after duration
      stepTimeout = setTimeout(() => {
        if (currentStep < processingStepsConfig.length - 1) {
          setCurrentStep(prev => prev + 1);
          setProgress(0);
        }
      }, currentStepData.duration);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
      if (stepTimeout) clearTimeout(stepTimeout);
    };
  }, [uploadLoading, currentStep]);

  // Reset progress when upload starts
  useEffect(() => {
    if (uploadLoading) {
      setCurrentStep(0);
      setProgress(0);
    }
  }, [uploadLoading]);

  // Calculate overall progress
  const getOverallProgress = () => {
    const stepProgress = (currentStep / processingStepsConfig.length) * 100;
    const currentStepProgress = (progress / processingStepsConfig.length);
    return Math.min(stepProgress + currentStepProgress, 100);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  // Validate and set selected file
  const handleFileSelection = (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allSupportedTypes.includes(fileExtension)) {
      setUploadStatus('error');
      setUploadMessage(t('admin.interviews.upload.unsupportedType', 'Unsupported file type. Please upload audio or text files only.'));
      return;
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadMessage(t('admin.interviews.upload.fileTooLarge', 'File size must be less than 100MB.'));
      return;
    }

    setSelectedFile(file);
    setUploadStatus(null);
    setUploadMessage('');
  };

  // Get file type icon
  const getFileIcon = (file) => {
    if (!file) return <Upload size={48} />;

    const extension = file.name.split('.').pop().toLowerCase();
    if (supportedTypes.audio.includes(extension)) {
      return <Music size={48} className="file-upload__file-icon file-upload__file-icon--audio" />;
    } else {
      return <FileText size={48} className="file-upload__file-icon file-upload__file-icon--text" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file upload (synchronous)
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus(null);
      setUploadMessage('');

      // Include session data in the upload request
      const result = await dispatch(uploadInterviewFile({
        interviewId,
        file: selectedFile,
        sessionData: {
          clientName: sessionData?.clientName || sessionData?.client_name || '',
          sessionId: sessionData?.id || '',
          notes: sessionData?.notes || '',
          preferred_language: sessionData?.preferred_language || 'en'
        }
      })).unwrap();

      setUploadStatus('success');
      setUploadMessage(t('admin.interviews.upload.success', 'File uploaded and processed successfully!'));

      // Call success callback with the updated interview data
      // result contains { interviewId, interview } from the Redux action
      setTimeout(() => {
        onSuccess && onSuccess(result.interview);
        onClose && onClose();
      }, 1500);

    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error || t('admin.interviews.upload.error', 'Failed to upload file. Please try again.'));
    }
  };

  // Handle async file upload
  const handleAsyncUpload = async () => {
    if (!selectedFile) return;

    try {
      // Show async processing modal and start with uploading stage
      setShowAsyncModal(true);
      setAsyncProcessingStage('uploading');
      setAsyncUploadStatus(null);
      setAsyncUploadMessage('');

      // Include session data in the upload request
      const result = await dispatch(uploadInterviewFileAsync({
        interviewId,
        file: selectedFile,
        sessionData: {
          clientName: sessionData?.clientName || sessionData?.client_name || '',
          sessionId: sessionData?.id || '',
          notes: sessionData?.notes || '',
          preferred_language: sessionData?.preferred_language || 'en'
        }
      })).unwrap();

      // File uploaded successfully, move to transcribing stage
      setAsyncProcessingStage('transcribing');
      setAsyncUploadStatus('success');
      setAsyncUploadMessage(t('admin.interviews.upload.asyncSuccess', 'File uploaded successfully! Processing will continue in the background.'));

      // WebSocket will handle further status updates automatically

    } catch (error) {
      setAsyncUploadStatus('error');
      setAsyncUploadMessage(error || t('admin.interviews.upload.asyncError', 'Failed to upload file. Please try again.'));
      setShowAsyncModal(false);
    }
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    setUploadMessage('');
    setAsyncUploadStatus(null);
    setAsyncUploadMessage('');
    setAsyncProcessingStage(null);
    setShowAsyncModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Async Processing Modal */}
      {showAsyncModal && (
        <div className="file-upload__async-modal">
          <div className="async-modal__content">
            <div className="async-modal__header">
              <h3>{t('admin.interviews.async.title', 'Processing Your Interview')}</h3>
            </div>

            <div className="async-modal__stages">
              {asyncStagesConfig.map((stage, index) => {
                const isActive = asyncProcessingStage === stage.id;
                const isCompleted = asyncStagesConfig.findIndex(s => s.id === asyncProcessingStage) > index;
                const isPending = asyncStagesConfig.findIndex(s => s.id === asyncProcessingStage) < index;

                return (
                  <div
                    key={stage.id}
                    className={`async-stage ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isPending ? 'pending' : ''}`}
                  >
                    <div className="async-stage__icon">
                      {isCompleted ? (
                        <CheckCircle size={32} className="completed-icon" />
                      ) : (
                        React.createElement(stage.icon, {
                          size: 32,
                          className: isActive ? "active-icon animate-pulse" : "pending-icon"
                        })
                      )}
                      <h4 className="async-stage__title">{stage.title}</h4>
                    </div>
                    <div className="async-stage__content">
                      <p className="async-stage__description">{stage.description}</p>
                      {isActive && (
                        <div className="async-stage__progress">
                          <div className="progress-dots">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {asyncUploadStatus === 'error' && (
              <div className="async-modal__error">
                <AlertCircle size={20} />
                <span>{asyncUploadMessage}</span>
              </div>
            )}

            <div className="async-modal__footer">
              <p className="async-modal__note">
                {t('admin.interviews.async.note', 'Please keep this window open for the whole draft generation proccess...')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Engaging Processing Overlay */}
      {/* {uploadLoading && (
        <div className="file-upload__processing-overlay">
          <div className="file-upload__processing-content">
            <div className="progress-header">
              <h3>{t('admin.interviews.upload.processingFile', 'Processing Your Interview')}</h3>
              <div className="overall-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${getOverallProgress()}%` }}
                  />
                </div>
                <span className="progress-text">{Math.round(getOverallProgress())}%</span>
              </div>
            </div>

            <div className="current-step">
              <div className="step-icon-container">
                {React.createElement(getProcessingSteps()[currentStep]?.icon || Loader, {
                  size: 64,
                  className: "step-icon animate-pulse"
                })}
              </div>
              <div className="step-info">
                <h4 className="step-title">{getProcessingSteps()[currentStep]?.title}</h4>
                <p className="step-description">{getProcessingSteps()[currentStep]?.description}</p>
                <div className="step-progress">
                  <div className="step-progress-bar">
                    <div 
                      className="step-progress-fill" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="steps-timeline">
              {getProcessingSteps().map((step, index) => (
                <div 
                  key={step.id} 
                  className={`timeline-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'active' : ''}`}
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
      )} */}
      <div className="file-upload">
        <div className="file-upload__header">
          <h3>{t('admin.interviews.upload.title', 'Upload Interview File')}</h3>
          <button className="file-upload__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="file-upload__content">
          {!selectedFile ? (
            <div
              className={`file-upload__dropzone ${dragActive ? 'file-upload__dropzone--active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={48} className="file-upload__icon" />
              <h4>{t('admin.interviews.upload.dropzone.title', 'Drop your file here or click to browse')}</h4>
              <p>{t('admin.interviews.upload.dropzone.subtitle', 'Supports audio files (MP3, WAV, M4A) and text files (TXT, PDF, DOC)')}</p>
              <p className="file-upload__size-limit">
                {t('admin.interviews.upload.sizeLimit', 'Maximum file size: 100MB')}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,.flac,.txt,.md,.pdf,.doc,.docx"
                onChange={handleFileInputChange}
                className="file-upload__input"
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="file-upload__selected">
              <div className="file-upload__file-info">
                {getFileIcon(selectedFile)}
                <div className="file-upload__file-details">
                  <h4>{selectedFile.name}</h4>
                  <p>{formatFileSize(selectedFile.size)}</p>
                  <p className="file-upload__file-type">
                    {supportedTypes.audio.includes(selectedFile.name.split('.').pop().toLowerCase())
                      ? t('admin.interviews.upload.audioFile', 'Audio File')
                      : t('admin.interviews.upload.textFile', 'Text File')
                    }
                  </p>
                </div>
                <button className="file-upload__remove" onClick={clearFile}>
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`file-upload__status file-upload__status--${uploadStatus}`}>
              {uploadStatus === 'success' && <CheckCircle size={20} />}
              {uploadStatus === 'error' && <AlertCircle size={20} />}
              <span>{uploadMessage}</span>
            </div>
          )}

          {/* Async Upload Status Messages */}
          {asyncUploadStatus && (
            <div className={`file-upload__status file-upload__status--${asyncUploadStatus}`}>
              {asyncUploadStatus === 'success' && <CheckCircle size={20} />}
              {asyncUploadStatus === 'error' && <AlertCircle size={20} />}
              <span>{asyncUploadMessage}</span>
            </div>
          )}

          {/* Upload Progress */}
          {(uploadLoading || asyncUploadLoading) && (
            <div className="file-upload__progress">
              <Loader size={20} className="file-upload__spinner" />
              <span>
                {uploadLoading
                  ? t('admin.interviews.upload.processing', 'Uploading and processing file...')
                  : t('admin.interviews.upload.asyncProcessing', 'Uploading file...')
                }
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="file-upload__actions">
            <button
              className="btn btn--secondary"
              onClick={onClose}
              disabled={uploadLoading || asyncUploadLoading}
            >
              {t('common.cancel', 'Cancel')}
            </button>

            {/* Synchronous Upload Button */}
            {/* <button
              className="btn btn--primary"
              onClick={handleUpload}
              disabled={!selectedFile || uploadLoading || asyncUploadLoading || uploadStatus === 'success' || asyncUploadStatus === 'success'}
            >
              {uploadLoading ? (
                <>
                  <Loader size={16} className="file-upload__spinner" />
                  {t('admin.interviews.upload.uploading', 'Uploading...')}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {t('admin.interviews.upload.upload', 'Upload & Process')}
                </>
              )}
            </button> */}

            {/* Async Upload Button */}
            <button
              className="btn btn--primary"
              onClick={handleAsyncUpload}
              disabled={!selectedFile || uploadLoading || asyncUploadLoading || uploadStatus === 'success' || asyncUploadStatus === 'success'}
              title={t('admin.interviews.upload.asyncTooltip', 'Upload file and process in background')}
            >
              {asyncUploadLoading ? (
                <>
                  <Loader size={16} className="file-upload__spinner" />
                  {t('admin.interviews.upload.uploading', 'Uploading...')}
                </>
              ) : (
                <>
                  <Upload size={16} />
                  {t('admin.interviews.upload.upload', 'Upload')}
                </>
              )}
            </button>
          </div>

          {/* Processing Info */}
          <div className="file-upload__info">
            <h5>{t('admin.interviews.upload.processInfo.title', 'What happens after upload?')}</h5>
            <ul>
              <li>{t('admin.interviews.upload.processInfo.step1', 'File is securely uploaded and stored')}</li>
              <li>{t('admin.interviews.upload.processInfo.step2', 'Audio files are automatically transcribed')}</li>
              <li>{t('admin.interviews.upload.processInfo.step3', 'AI generates a draft life story')}</li>
              <li>{t('admin.interviews.upload.processInfo.step4', 'Interview is marked as completed')}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default FileUpload;
