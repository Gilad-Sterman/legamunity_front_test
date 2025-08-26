import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users, Activity, CheckCircle, BookOpen, Star,
  LogIn, FileText, Clock, Database, Server, Code, AlertTriangle,
  Zap, Upload, Download, Cpu, Workflow, GitBranch
} from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { fetchSessionStats } from '../store/slices/sessionsSliceSupabase';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  // State for recent activity logs from the API
  const [recentActivity, setRecentActivity] = useState([]);

  // Systems data with descriptions instead of usage percentages
  const systemsUsage = [
    {
      name: "Supabase",
      icon: Database,
      logoUrl: "https://seeklogo.com/images/S/supabase-logo-DCC676FFE2-seeklogo.com.png",
      description: t('admin.systemsUsed.systems.supabase', 'Database and authentication'),
      details: t('admin.systemsUsed.systems.supabaseDetails', 'Used for storing user data, sessions, interviews and drafts with real-time capabilities'),
      color: '#3ECF8E'
    },
    {
      name: "N8N",
      icon: Workflow,
      logoUrl: "https://avatars.githubusercontent.com/u/45487711",
      description: t('admin.systemsUsed.systems.n8n', 'Workflow automation'),
      details: t('admin.systemsUsed.systems.n8nDetails', 'Handles automated email notifications and scheduled tasks for interview reminders'),
      color: '#FF6D5A'
    },
    {
      name: "React",
      icon: Code,
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1150px-React-icon.svg.png",
      description: t('admin.systemsUsed.systems.react', 'Frontend framework'),
      details: t('admin.systemsUsed.systems.reactDetails', 'Powers our responsive user interface with component-based architecture'),
      color: '#61DAFB'
    },
    {
      name: "Node.js",
      icon: Server,
      logoUrl: "https://nodejs.org/static/images/logo.svg",
      description: t('admin.systemsUsed.systems.nodejs', 'Backend server'),
      details: t('admin.systemsUsed.systems.nodejsDetails', 'Runs our API server with Express for handling client requests'),
      color: '#539E43'
    },
    {
      name: "Cloudinary",
      icon: Upload,
      logoUrl: "https://res.cloudinary.com/cloudinary/image/upload/v1538583988/cloudinary_logo_for_white_bg.png",
      description: t('admin.systemsUsed.systems.cloudinary', 'Media management'),
      details: t('admin.systemsUsed.systems.cloudinaryDetails', 'Stores and optimizes images and audio files from interviews'),
      color: '#3448C5'
    }
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

  // Update recent activity when stats are loaded
  useEffect(() => {
    if (stats && stats.recentLogs && Array.isArray(stats.recentLogs)) {
      setRecentActivity(stats.recentLogs);
    }
  }, [stats]);

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
            {recentActivity.length === 0 ? (
              <div className="admin-dashboard-page__activity-empty">
                {loading ? (
                  <div className="admin-dashboard-page__loading-animation">
                    <div className="admin-dashboard-page__loading-spinner"></div>
                    {t('admin.activity.loading', 'Loading recent activity...')}
                  </div>
                ) : t('admin.activity.noActivity', 'No recent activity found')}
              </div>
            ) : recentActivity.map(activity => {
              // Determine icon based on event type
              let Icon;
              let colorClass;

              switch (activity.event_type) {
                case 'auth':
                  Icon = LogIn;
                  colorClass = 'blue';
                  break;
                case 'session':
                  Icon = Users;
                  colorClass = 'green';
                  break;
                case 'interview':
                  Icon = activity.event_action === 'created' ? Zap : Activity;
                  colorClass = 'purple';
                  break;
                case 'draft':
                  Icon = activity.event_action === 'generated' ? Star : FileText;
                  colorClass = 'orange';
                  break;
                case 'file':
                  Icon = activity.event_action === 'uploaded' ? Upload : Download;
                  colorClass = 'blue';
                  break;
                case 'error':
                  Icon = AlertTriangle;
                  colorClass = 'red';
                  break;
                case 'system':
                  if (activity.event_action === 'startup') {
                    Icon = Cpu;
                    colorClass = 'green';
                  } else if (activity.event_action === 'api_request') {
                    Icon = GitBranch;
                    colorClass = 'blue';
                  } else if (activity.event_action === 'database') {
                    Icon = Database;
                    colorClass = 'purple';
                  } else {
                    Icon = Server;
                    colorClass = 'blue';
                  }
                  break;
                default:
                  Icon = Clock;
                  colorClass = 'gray';
              }

              // Format the activity description
              const getActivityDescription = () => {
                if (!activity.event_action) return t('admin.activity.unknown', 'Unknown activity');

                const action = activity.event_action.charAt(0).toUpperCase() + activity.event_action.slice(1);
                const user = activity.user_email || t('admin.activity.unknownUser', 'Unknown user');
                const sessionInfo = activity.session_id ? ` (Session ${activity.session_id.substring(0, 8)}...)` : '';

                switch (activity.event_type) {
                  case 'auth':
                    return t('admin.activity.auth', '{{action}} by {{user}}', { action, user });
                  case 'session':
                    return t('admin.activity.session', 'Session {{action}} by {{user}}{{sessionInfo}}', { action, user, sessionInfo });
                  case 'interview':
                    return t('admin.activity.interview', 'Interview {{action}} by {{user}}{{sessionInfo}}', { action, user, sessionInfo });
                  case 'draft':
                    return t('admin.activity.draft', 'Draft {{action}} by {{user}}{{sessionInfo}}', { action, user, sessionInfo });
                  case 'file':
                    return t('admin.activity.file', 'File {{action}} by {{user}}{{sessionInfo}}', { action, user, sessionInfo });
                  case 'error':
                    return t('admin.activity.error', 'Error: {{message}}', { message: activity.error_message || action });
                  case 'system':
                    return t('admin.activity.system', 'System {{action}} reported', { action });
                  default:
                    return t('admin.activity.unknown', 'Activity: {{type}} {{action}}', { type: activity.event_type, action });
                }
              };

              return (
                <div key={activity.id} className={`admin-dashboard-page__activity-item ${colorClass}`}>
                  <div className={`admin-dashboard-page__activity-icon ${colorClass}`}>
                    {React.createElement(Icon, { size: 16, color: 'currentColor' })}
                  </div>
                  <div className="admin-dashboard-page__activity-content">
                    <div className="admin-dashboard-page__activity-description">
                      {getActivityDescription()}
                      {activity.user_email && (
                        <span className="admin-dashboard-page__activity-user">
                          {activity.user_email.split('@')[0]}
                        </span>
                      )}
                    </div>
                    <div className="admin-dashboard-page__activity-time">
                      {activity.created_at && formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {recentActivity.length > 0 && (
            <div className="admin-dashboard-page__activity-footer">
              <div className="admin-dashboard-page__activity-footer-content">
                <Clock size={14} />
                <small>{t('admin.activity.showingRecent', 'Showing {{count}} most recent activities', { count: recentActivity.length })}</small>
              </div>
            </div>
          )}
        </div>

        <div className="admin-dashboard-page__systems-container">
          <h2 className="admin-dashboard-page__section-title">{t('admin.systemsUsed.title', 'Systems Used')}</h2>
          <div className="admin-dashboard-page__systems-list">
            {systemsUsage.map((system) => (
              <div key={system.name} className="admin-dashboard-page__system-item">
                <div className="admin-dashboard-page__system-header">
                  <div
                    className="admin-dashboard-page__system-icon"
                    style={{ backgroundColor: system.color + '15' }} // Light background based on system color
                  >
                    {system.logoUrl ? (
                      <img
                        src={system.logoUrl}
                        alt={`${system.name} logo`}
                        className="admin-dashboard-page__system-logo"
                      />
                    ) : React.createElement(system.icon, { color: system.color })}
                  </div>
                  <div className="admin-dashboard-page__system-name">{system.name}</div>
                </div>
                <div className="admin-dashboard-page__system-details">
                  <div className="admin-dashboard-page__system-description">
                    <span
                      className="admin-dashboard-page__system-description-title"
                      style={{ color: system.color }}
                    >
                      {t(`admin.systemsUsed.systems.${system.name.toLowerCase()}`, system.description)}
                    </span>
                    <div className="admin-dashboard-page__system-description-details">
                      {t(`admin.systemsUsed.systems.${system.name.toLowerCase()}Details`, system.details)}
                    </div>
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
