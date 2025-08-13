import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Activity, CheckCircle, Clock, FileText, ThumbsUp, TrendingUp, Calendar, BookOpen, Star, BarChart3 } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { fetchSessionStats } from '../store/slices/sessionsSliceSupabase';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hasFetchedRef = useRef(false);
  
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
    
    // Draft metrics
    totalDrafts: stats?.totalDrafts?.toString() || '0',
    draftsAwaitingApproval: stats?.draftsAwaitingApproval?.toString() || '0',
    approvedDrafts: stats?.approvedDrafts?.toString() || '0',
    draftApprovalRate: stats?.draftApprovalRate ? `${stats.draftApprovalRate}%` : '0%',
    
    // Interview metrics
    totalInterviews: stats?.totalInterviews?.toString() || '0',
    completedInterviews: stats?.completedInterviews?.toString() || '0',
    interviewCompletionRate: stats?.interviewCompletionRate ? `${stats.interviewCompletionRate}%` : '0%',
    
    // Recent activity
    recentInterviews: stats?.recentInterviews?.toString() || '0',
    recentDrafts: stats?.recentDrafts?.toString() || '0',
    
    // Life Story metrics
    totalLifeStories: stats?.totalLifeStories?.toString() || '0',
    generatedLifeStories: stats?.generatedLifeStories?.toString() || '0',
    approvedLifeStories: stats?.approvedLifeStories?.toString() || '0',
    rejectedLifeStories: stats?.rejectedLifeStories?.toString() || '0',
    avgWordsPerStory: stats?.avgWordsPerStory?.toString() || '0',
    totalStoryWords: stats?.totalStoryWords?.toString() || '0'
  };
  
  // Load stats on component mount
  useEffect(() => {
    // Only fetch if we haven't fetched before and we're not already loading
    if (!hasFetchedRef.current && !loading) {
      hasFetchedRef.current = true;
      dispatch(fetchSessionStats());
    }
  }, [dispatch, loading]);

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
        <div className="admin-dashboard-page__kpi-grid">
          <KpiCard 
            title={t('admin.kpi.totalSessions')} 
            value={kpis.totalSessions} 
            icon={Users} 
            loading={loading}
            color="blue"
          />
          <KpiCard 
            title={t('admin.kpi.activeSessions')} 
            value={kpis.activeSessions} 
            icon={Activity} 
            loading={loading}
            color="green"
          />
          <KpiCard 
            title={t('admin.kpi.completedSessions', 'Completed Sessions')} 
            value={kpis.completedSessions} 
            icon={CheckCircle} 
            loading={loading}
            color="purple"
          />
        </div>
      </section>

      {/* Draft Management Metrics */}
      <section className="admin-dashboard-page__section">
        <h2 className="admin-dashboard-page__section-title">{t('admin.sections.draftManagement', 'Draft Management')}</h2>
        <div className="admin-dashboard-page__kpi-grid">
          <KpiCard 
            title={t('admin.kpi.totalDrafts', 'Total Drafts')} 
            value={kpis.totalDrafts} 
            icon={FileText} 
            loading={loading}
            color="indigo"
          />
          <KpiCard 
            title={t('admin.kpi.draftsAwaitingApproval', 'Awaiting Approval')} 
            value={kpis.draftsAwaitingApproval} 
            icon={Clock} 
            loading={loading}
            color="yellow"
          />
          <KpiCard 
            title={t('admin.kpi.approvedDrafts', 'Approved Drafts')} 
            value={kpis.approvedDrafts} 
            icon={ThumbsUp} 
            loading={loading}
            color="green"
          />
          <KpiCard 
            title={t('admin.kpi.draftApprovalRate', 'Approval Rate')} 
            value={kpis.draftApprovalRate} 
            icon={TrendingUp} 
            loading={loading}
            color="emerald"
          />
        </div>
      </section>

      {/* Interview Progress Metrics */}
      <section className="admin-dashboard-page__section">
        <h2 className="admin-dashboard-page__section-title">{t('admin.sections.interviewProgress', 'Interview Progress')}</h2>
        <div className="admin-dashboard-page__kpi-grid">
          <KpiCard 
            title={t('admin.kpi.totalInterviews', 'Total Interviews')} 
            value={kpis.totalInterviews} 
            icon={Users} 
            loading={loading}
            color="cyan"
          />
          <KpiCard 
            title={t('admin.kpi.completedInterviews', 'Completed Interviews')} 
            value={kpis.completedInterviews} 
            icon={CheckCircle} 
            loading={loading}
            color="teal"
          />
          <KpiCard 
            title={t('admin.kpi.interviewCompletionRate', 'Completion Rate')} 
            value={kpis.interviewCompletionRate} 
            icon={TrendingUp} 
            loading={loading}
            color="lime"
          />
        </div>
      </section>

      {/* Life Stories Overview */}
      <section className="admin-dashboard-page__section">
        <h2 className="admin-dashboard-page__section-title">{t('admin.sections.lifeStoriesOverview', 'Life Stories Overview')}</h2>
        <div className="admin-dashboard-page__kpi-grid">
          <KpiCard 
            title={t('admin.kpi.totalLifeStories', 'Total Life Stories')} 
            value={kpis.totalLifeStories} 
            icon={BookOpen} 
            loading={loading}
            color="purple"
          />
          <KpiCard 
            title={t('admin.kpi.generatedLifeStories', 'Generated Stories')} 
            value={kpis.generatedLifeStories} 
            icon={FileText} 
            loading={loading}
            color="blue"
          />
          <KpiCard 
            title={t('admin.kpi.approvedLifeStories', 'Approved Stories')} 
            value={kpis.approvedLifeStories} 
            icon={Star} 
            loading={loading}
            color="green"
          />
          <KpiCard 
            title={t('admin.kpi.avgWordsPerStory', 'Avg Words/Story')} 
            value={kpis.avgWordsPerStory} 
            icon={BarChart3} 
            loading={loading}
            color="orange"
          />
        </div>
      </section>

      {/* Recent Activity */}
      <section className="admin-dashboard-page__section">
        <h2 className="admin-dashboard-page__section-title">{t('admin.sections.recentActivity', 'Recent Activity (Last 7 Days)')}</h2>
        <div className="admin-dashboard-page__kpi-grid admin-dashboard-page__kpi-grid--two-col">
          <KpiCard 
            title={t('admin.kpi.recentInterviews', 'Recent Interviews')} 
            value={kpis.recentInterviews} 
            icon={Calendar} 
            loading={loading}
            color="rose"
          />
          <KpiCard 
            title={t('admin.kpi.recentDrafts', 'Recent Drafts')} 
            value={kpis.recentDrafts} 
            icon={FileText} 
            loading={loading}
            color="violet"
          />
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
