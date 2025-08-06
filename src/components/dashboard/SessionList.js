import React from 'react';
import { useTranslation } from 'react-i18next';
import SessionListItem from './SessionListItem';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';

const SessionList = ({ sessions, title, loading, emptyMessage }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="session-list session-list--loading">
        <p className="session-list__loading-message">{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="session-list session-list--empty">
        <p className="session-list__empty-message">{emptyMessage || t('admin.sessions.noActiveSessions')}</p>
      </div>
    );
  }

  return (
    <div className="session-list">
      <div className="session-list__header">
        <h3 className="session-list__title">{title || t('admin.sessions.active')}</h3>
        <div className="session-list__button-container">
          <Eye className="session-list__button-icon" />
          <button className="session-list__button" onClick={() => navigate('/admin/sessions')}>{t('admin.sessions.viewAll')}</button>
        </div>
      </div>
      <ul className="session-list__content">
        {sessions.map((session) => (
          <SessionListItem key={session.id} session={session} />
        ))}
      </ul>
    </div>
  );
};

export default SessionList;
