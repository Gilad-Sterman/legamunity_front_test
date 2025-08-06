import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Upload, Mic, FileAudio } from 'lucide-react';

const StartInterview = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">{t('sidebar.startInterview')}</h1>
      </header>

      <div className="admin-page__content">
        <div className="placeholder-content">
          <Play className="placeholder-icon" size={64} />
          <h2>Start Interview</h2>
          <p>This page will contain the interview initiation interface.</p>
          <p>Features to implement:</p>
          <ul>
            <li>Upload audio file option</li>
            <li>Live interview recording</li>
            <li>Client information display</li>
            <li>Interview session management</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StartInterview;
