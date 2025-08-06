import React from 'react';
import { useTranslation } from 'react-i18next';
import { Radio, Mic, Volume2, Square } from 'lucide-react';

const LiveInterview = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">{t('sidebar.liveInterview')}</h1>
      </header>

      <div className="admin-page__content">
        <div className="placeholder-content">
          <Radio className="placeholder-icon" size={64} />
          <h2>Live Interview</h2>
          <p>This page will contain the live interview monitoring interface.</p>
          <p>Features to implement:</p>
          <ul>
            <li>Real-time audio monitoring</li>
            <li>Live transcription display</li>
            <li>Interview controls (pause, stop, resume)</li>
            <li>Session status tracking</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LiveInterview;
