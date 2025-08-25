import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Activity, CheckCircle, BookOpen, Star, BarChart3, Award, LogIn, FileText, Clock, Database, Server, Code } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { fetchSessionStats } from '../store/slices/sessionsSliceSupabase';
import { useNavigate } from 'react-router-dom';
// import { format, formatDistanceToNow } from 'date-fns';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);
  
  // Mock recent activity data based on logs table example
  const [recentActivity, setRecentActivity] = useState([
    {
      id: "ce7d850d-ae3b-497d-a851-a83cd5797634",
      event_type: "auth",
      event_action: "login",
      user_email: "giladsterman1999@gmail.com",
      created_at: "2025-08-25 19:07:53.962484+00",
      severity: "info"
    },
    {
      id: "a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2d",
      event_type: "session",
      event_action: "create",
      user_email: "admin@legamunity.com",
      created_at: "2025-08-25 18:45:12.123456+00",
      severity: "info"
    },
    {
      id: "f9e8d7c6-b5a4-4321-8765-4f3e2d1c0b9a",
      event_type: "interview",
      event_action: "complete",
      user_email: "interviewer@legamunity.com",
      created_at: "2025-08-25 17:30:45.654321+00",
      severity: "info"
    },
    {
      id: "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      event_type: "draft",
      event_action: "approve",
      user_email: "editor@legamunity.com",
      created_at: "2025-08-25 16:15:22.987654+00",
      severity: "info"
    },
    {
      id: "5f4e3d2c-1b0a-9f8e-7d6c-5b4a3c2d1e0f",
      event_type: "system",
      event_action: "error",
      user_email: "system@legamunity.com",
      created_at: "2025-08-25 15:05:18.246810+00",
      severity: "error"
    }
  ]);
  
  // Systems usage data
  const systemsUsage = [
    { name: "Supabase", icon: Database, usage: 85, description: t('admin.systemsUsed.systems.supabase', 'Database and authentication') },
    { name: "N8N", icon: Server, usage: 72, description: t('admin.systemsUsed.systems.n8n', 'Workflow automation') },
    { name: "React", icon: Code, usage: 94, description: t('admin.systemsUsed.systems.react', 'Frontend framework') },
    { name: "Node.js", icon: Server, usage: 78, description: t('admin.systemsUsed.systems.nodejs', 'Backend server') }
  ];

  // Get stats from Redux store
  const {
    loading,
    stats
  } = useSelector(state => state.sessions);

  // Format KPI data from enhanced stats
  const kpis = {
    // Core session metrics
    totalSessions: stats?.totalSessions?.toString() || '0',
    activeSessions: stats?.activeSessions?.toString() || '0',
    completedSessions: stats?.completedSessions?.toString() || '0',

    //rejected drafts
    rejectedDrafts: stats?.rejectedDrafts?.toString() || '0',

    // Life Story metrics
    totalLifeStories: stats?.totalLifeStories?.toString() || '0',
    uniqueSessionLifeStories: stats?.uniqueSessionLifeStories?.toString() || '0',
    generatedLifeStories: stats?.generatedLifeStories?.toString() || '0',
    approvedLifeStories: stats?.approvedLifeStories?.toString() || '0',
    avgWordsPerStory: stats?.avgWordsPerStory?.toString() || '0'
  };

  // Load stats on component mount
  useEffect(() => {
    // Only fetch if we haven't fetched before and we're not already loading
    if (!hasFetchedRef.current && !loading) {
      hasFetchedRef.current = true;
      dispatch(fetchSessionStats());
    }
  }, [dispatch, loading]);

  console.log(stats);

  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-page__header">
        <h1 className="admin-dashboard-page__title">{t('admin.dashboardTitle')}</h1>
        <div className="admin-dashboard-page__subtitle">
          {t('admin.dashboardSubtitle', 'Overview of system activity and performance')}
        </div>
      </header>

      {/* Core Session Metrics */}
      <section className="admin-dashboard-page__section">
        <h2 className="admin-dashboard-page__section-title">{t('admin.sections.sessionOverview', 'Session Overview')}</h2>
        <div className="admin-dashboard-page__buttons-container">
          <button className="admin-dashboard-page__button" onClick={() => navigate('/admin/sessions')}>{t('admin.buttons.viewSessions', 'View All Sessions')}</button>
          <button className="admin-dashboard-page__button" onClick={() => navigate('/admin/full-life-stories')}>{t('admin.buttons.viewLifeStories', 'View All Life Stories')}</button>
        </div>
        <div className="admin-dashboard-page__kpi-grid">
          <KpiCard
            title={t('admin.kpi.totalSessions')}
            value={kpis.totalSessions}
            icon={Users}
            loading={loading}
            color="blue"
          />
          <KpiCard
            title={t('admin.kpi.completedSessions', 'Completed Sessions')}
            value={kpis.completedSessions}
            icon={CheckCircle}
            loading={loading}
            color="purple"
          />
          <KpiCard
            title={t('admin.kpi.totalLifeStories', 'Total Life Stories')}
            value={kpis.totalLifeStories}
            icon={BookOpen}
            loading={loading}
            color="purple"
          />
          <KpiCard
            title={t('admin.kpi.approvedLifeStories', 'Approved Stories')}
            value={kpis.approvedLifeStories}
            icon={Star}
            loading={loading}
            color="green"
          />
        </div>
      </section>

      {/* Recent Activity and Systems Used sections */}
      <div className="admin-dashboard-page__section admin-dashboard-page__section--bottom">
        {/* Recent activity */}
        <div className="admin-dashboard-page__activity-container">
          <h2 className="admin-dashboard-page__section-title">{t('admin.sections.recentActivity', 'Recent Activity')}</h2>
          <div className="admin-dashboard-page__activity-list">
            {recentActivity.map(activity => {
              // Determine icon based on event type
              let Icon;
              let colorClass;
              
              switch(activity.event_type) {
                case 'auth':
                  Icon = LogIn;
                  colorClass = 'blue';
                  break;
                case 'session':
                  Icon = Users;
                  colorClass = 'purple';
                  break;
                case 'interview':
                  Icon = Activity;
                  colorClass = 'green';
                  break;
                case 'draft':
                  Icon = FileText;
                  colorClass = 'orange';
                  break;
                case 'system':
                  Icon = Server;
                  colorClass = activity.severity === 'error' ? 'red' : 'gray';
                  break;
                default:
                  Icon = Clock;
                  colorClass = 'gray';
              }
              
              // Format the activity description
              const getActivityDescription = () => {
                const action = activity.event_action.charAt(0).toUpperCase() + activity.event_action.slice(1);
                switch(activity.event_type) {
                  case 'auth':
                    return t('admin.activity.auth', '{{action}} by {{user}}', { action, user: activity.user_email });
                  case 'session':
                    return t('admin.activity.session', 'Session {{action}} by {{user}}', { action, user: activity.user_email });
                  case 'interview':
                    return t('admin.activity.interview', 'Interview {{action}} by {{user}}', { action, user: activity.user_email });
                  case 'draft':
                    return t('admin.activity.draft', 'Draft {{action}} by {{user}}', { action, user: activity.user_email });
                  case 'system':
                    return t('admin.activity.system', 'System {{action}} reported', { action });
                  default:
                    return t('admin.activity.unknown', 'Unknown activity');
                }
              };
              
              return (
                <div key={activity.id} className={`admin-dashboard-page__activity-item admin-dashboard-page__activity-item--${colorClass} ${activity.severity === 'error' ? 'admin-dashboard-page__activity-item--error' : ''}`}>
                  <div className="admin-dashboard-page__activity-icon">
                    <Icon size={18} />
                  </div>
                  <div className="admin-dashboard-page__activity-content">
                    <div className="admin-dashboard-page__activity-description">
                      {getActivityDescription()}
                    </div>
                    <div className="admin-dashboard-page__activity-time">
                      {/* {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })} */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-dashboard-page__systems-container">
          <h2 className="admin-dashboard-page__section-title">{t('admin.systemsUsed.title', 'Systems Used')}</h2>
          <div className="admin-dashboard-page__systems-list">
            {systemsUsage.map((system) => (
              <div key={system.name} className="admin-dashboard-page__system-item">
                <div className="admin-dashboard-page__system-header">
                  <div className="admin-dashboard-page__system-icon">
                    {React.createElement(system.icon)}
                  </div>
                  <div className="admin-dashboard-page__system-name">{system.name}</div>
                </div>
                <div className="admin-dashboard-page__system-progress-container">
                  <div 
                    className="admin-dashboard-page__system-progress-bar" 
                    style={{ width: `${system.usage}%` }}
                  ></div>
                </div>
                <div className="admin-dashboard-page__system-details">
                  <div className="admin-dashboard-page__system-usage">{system.usage}%</div>
                  <div className="admin-dashboard-page__system-description">
                    {t(`admin.systemsUsed.${system.name.toLowerCase()}Description`, system.description)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
