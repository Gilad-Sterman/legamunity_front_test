import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, X, FileText, Music, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { uploadInterviewFile } from '../../../store/slices/sessionsSliceSupabase';

const FileUpload = ({ interviewId, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { uploadLoading } = useSelector(state => state.sessions);
  
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [uploadMessage, setUploadMessage] = useState('');
  
  const fileInputRef = useRef(null);

  // Supported file types
  const supportedTypes = {
    audio: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'flac'],
    text: ['txt', 'md', 'pdf', 'doc', 'docx']
  };

  const allSupportedTypes = [...supportedTypes.audio, ...supportedTypes.text];

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

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus(null);
      setUploadMessage('');
      
      const result = await dispatch(uploadInterviewFile({
        interviewId,
        file: selectedFile
      })).unwrap();

      setUploadStatus('success');
      setUploadMessage(t('admin.interviews.upload.success', 'File uploaded and processed successfully!'));
      
      // Call success callback with the updated interview data
      setTimeout(() => {
        onSuccess && onSuccess(result.interview);
        onClose && onClose();
      }, 1500);

    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error || t('admin.interviews.upload.error', 'Failed to upload file. Please try again.'));
    }
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setUploadStatus(null);
    setUploadMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
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

        {/* Upload Progress */}
        {uploadLoading && (
          <div className="file-upload__progress">
            <Loader size={20} className="file-upload__spinner" />
            <span>{t('admin.interviews.upload.processing', 'Uploading and processing file...')}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="file-upload__actions">
          <button
            className="btn btn--secondary"
            onClick={onClose}
            disabled={uploadLoading}
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            className="btn btn--primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploadLoading || uploadStatus === 'success'}
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
  );
};

export default FileUpload;
