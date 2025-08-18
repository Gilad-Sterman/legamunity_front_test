import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Users, Activity, CheckCircle, BookOpen, Star, BarChart3, Award } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { fetchSessionStats } from '../store/slices/sessionsSliceSupabase';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
        <button className="admin-dashboard-page__button" onClick={() => navigate('/admin/sessions')}>{t('admin.buttons.viewSessions', 'View All Sessions')}</button>
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


      {/* Life Stories Overview */}
      <section className="admin-dashboard-page__section">
        <h2 className="admin-dashboard-page__section-title">{t('admin.sections.lifeStoriesOverview', 'Life Stories Overview')}</h2>
        <button className="admin-dashboard-page__button" onClick={() => navigate('/admin/full-life-stories')}>{t('admin.buttons.viewLifeStories', 'View All Life Stories')}</button>
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
            icon={Activity} 
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
        </div>
      </section>

      {/* Rejected Drafts */}
      <section className="admin-dashboard-page__section">
        <h2 className="admin-dashboard-page__section-title">{t('admin.sections.rejectedDrafts', 'Rejected Drafts')}</h2>
        <div className="admin-dashboard-page__kpi-grid">
          <KpiCard 
            title={t('admin.kpi.rejectedDrafts', 'Rejected Drafts')} 
            value={kpis.rejectedDrafts} 
            icon={Star} 
            loading={loading}
            color="red"
          />
        </div>
      </section>

    </div>
  );
};

export default AdminDashboard;
