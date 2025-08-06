import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckSquare, Star, RefreshCw, ThumbsUp, Eye, FileDown, Plus } from 'lucide-react';
import IconCard from '../components/common/IconCard';
import IconButton from '../components/common/IconButton';
import IconBadge from '../components/common/IconBadge';

const Dashboard = () => {
  // Get translation hook
  const { t } = useTranslation();
  
  // This will be connected to Redux later
  const sessions = useSelector(state => state.sessions?.sessions || []);
  const stats = {
    activeSessions: 0,
    completedSessions: 0,
    cqsScore: 0,
    conflictResolutionRate: 0,
    friendApprovalRate: 0
  };

  // Sample KPI cards data
  const kpiCards = [
    { title: t('dashboard.activeSessionsCard'), value: stats.activeSessions, icon: Calendar, color: 'primary' },
    { title: t('dashboard.completedSessionsCard'), value: stats.completedSessions, icon: CheckSquare, color: 'success' },
    { title: t('dashboard.cqsScoreCard'), value: `${stats.cqsScore}%`, icon: Star, color: 'warning' },
    { title: t('dashboard.conflictResolutionCard'), value: `${stats.conflictResolutionRate}%`, icon: RefreshCw, color: 'info' },
    { title: t('dashboard.friendApprovalCard'), value: `${stats.friendApprovalRate}%`, icon: ThumbsUp, color: 'secondary' },
  ];

  return (
    <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>{t('dashboard.title')}</h1>
        </div>
        
        <div className="dashboard-content">
          {/* Stats Cards */}
          <div className="stats-container">
            {kpiCards.map((card, index) => (
              <IconCard 
                key={index}
                icon={card.icon}
                title={card.title}
                value={card.value}
                color={card.color}
              />
            ))}
          </div>
          
          {/* Recent Activity */}
          <div className="recent-activity">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">{t('dashboard.recentSessions')}</h2>
                <IconButton 
                  icon={Eye} 
                  text={t('dashboard.viewAll')} 
                  variant="primary" 
                  size="sm" 
                />
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('dashboard.tableUser')}</th>
                        <th>{t('dashboard.tableStatus')}</th>
                        <th>{t('dashboard.tableDate')}</th>
                        <th>{t('dashboard.tableCQS')}</th>
                        <th>{t('dashboard.tableActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.length > 0 ? (
                        sessions.map((session) => (
                          <tr key={session.id}>
                            <td>
                              <div className="user-info">
                                <div className="user-avatar">
                                  {session.user.name.charAt(0)}
                                </div>
                                <div className="user-details">
                                  <div className="user-name">{session.user.name}</div>
                                  <div className="user-phone">{session.user.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <IconBadge status={session.status} />
                            </td>
                            <td>
                              {new Date(session.scheduledAt).toLocaleDateString()}
                            </td>
                            <td>
                              {session.cqsScore}%
                            </td>
                            <td>
                              <IconButton 
                                icon={Eye} 
                                text={t('dashboard.view')} 
                                variant="outline" 
                                size="sm" 
                                className="mr-2"
                              />
                              <IconButton 
                                icon={FileDown} 
                                text={t('dashboard.export')} 
                                variant="outline" 
                                size="sm" 
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="empty-state">
                            {t('dashboard.noSessionsFound')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Upcoming Interviews */}
          <div className="upcoming-interviews">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">{t('dashboard.upcomingInterviews')}</h2>
                <IconButton 
                  icon={Plus} 
                  text={t('dashboard.scheduleNew')} 
                  variant="primary" 
                  size="sm" 
                />
              </div>
              <div className="card-body">
                <div className="empty-state">
                  {t('dashboard.noUpcomingInterviews')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;
