import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Clock } from 'lucide-react';

const SessionListItem = ({ session }) => {
  const { t } = useTranslation();

  // Get completion percentage from metadata or default to 0
  const completionPercentage = session.preferences?.metadata?.story_completion_percentage || 0;
  
  // Count completed interviews
  const interviews = session.preferences?.interviews || session.interviews || [];
  const completedInterviews = interviews.filter(interview => interview.status === 'completed').length;
  const totalInterviews = interviews.length;
  
  // Format estimated duration
  const estimatedDuration = session.preferences?.estimated_duration || 'N/A';

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
      case 'in progress':
        return 'session-list-item__status--in-progress';
      case 'pending_review':
      case 'pending review':
        return 'session-list-item__status--pending-review';
      case 'scheduled':
        return 'session-list-item__status--scheduled';
      case 'completed':
        return 'session-list-item__status--completed';
      default:
        return 'session-list-item__status--default';
    }
  };

  const getTranslatedStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'in progress':
        return t('admin.sessions.status.inProgress');
      case 'pending review':
        return t('admin.sessions.status.pendingReview');
      case 'scheduled':
        return t('admin.sessions.status.scheduled');
      case 'active':
        return t('admin.sessions.status.active');
      case 'completed':
        return t('admin.sessions.status.completed');
      default:
        return status || 'N/A';
    }
  };

  // Format priority level
  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'session-list-item__priority--high';
      case 'medium':
        return 'session-list-item__priority--medium';
      case 'standard':
      default:
        return 'session-list-item__priority--standard';
    }
  };

  const getTranslatedPriority = (priority) => {
    if (!priority) return t('admin.sessions.priorities.standard', 'Standard');
    return t(`admin.sessions.priorities.${priority.toLowerCase()}`, priority);
  };

  return (
    <li className="session-list-item">
      <div className="session-list-item__main">
        <div className="session-list-item__user-info">
          <p className="session-list-item__user-name">{session.client_name}</p>
          <p className="session-list-item__user-phone">{session.client_phone}</p>
        </div>
        <div className="session-list-item__details">
          <div className="session-list-item__metrics">
            <span className={`session-list-item__priority ${getPriorityClass(session.preferences?.priority_level)}`}>
              {getTranslatedPriority(session.preferences?.priority_level)}
            </span>
            <p className="session-list-item__interviews">
              {t('admin.sessions.completedInterviews', 'Completed')}: {completedInterviews}/{totalInterviews}
            </p>
            <p className="session-list-item__duration">
              <Clock size={14} className="session-list-item__duration-icon" />
              {t('admin.sessions.estimatedDuration', 'Est.')}: {estimatedDuration}
            </p>
          </div>
          <span className={`session-list-item__status ${getStatusClass(session.status)}`}>
            {getTranslatedStatus(session.status)}
          </span>
          {/* <ChevronRight className="session-list-item__arrow" /> */}
        </div>
      </div>
      <div className="session-list-item__progress-bar-container">
        <div className="session-list-item__progress-bar">
          <div 
            className="session-list-item__progress-bar-inner" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
    </li>
  );
};

export default SessionListItem;
