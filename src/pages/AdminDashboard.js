import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { SlidersHorizontal, Search, Bell, Users, Activity, CheckCircle, Clock } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import SessionList from '../components/dashboard/SessionList';
import { fetchSessions, fetchSessionStats } from '../store/slices/sessionsSliceSupabase';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get sessions and stats from Redux store
  const { 
    sessions, 
    loading, 
    stats
  } = useSelector(state => state.sessions);
  
  // Format KPI data from stats
  const kpis = {
    totalSessions: stats?.totalSessions?.toString() || '0',
    activeSessions: stats?.activeSessions?.toString() || '0',
    cqsAverage: stats?.averageCqs ? `${stats.averageCqs}%` : '0%',
    pendingReview: stats?.pendingReview?.toString() || '0',
  };
  
  // Load sessions and stats on component mount
  useEffect(() => {
    dispatch(fetchSessions({ 
      limit: 5, 
      status: 'active',
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    }));
    dispatch(fetchSessionStats());
  }, [dispatch]);
  
  // Handle search input
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      dispatch(fetchSessions({ 
        search: value,
        limit: 5,
        status: 'active'
      }));
    }, 500);
    
    return () => clearTimeout(timeoutId);
  };

  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-page__header">
        <h1 className="admin-dashboard-page__title">{t('admin.dashboardTitle')}</h1>
        <div className="admin-dashboard-page__header-actions">
          <button className="btn btn--icon">
            <Bell className="icon" />
          </button>
          {/* User profile can go here */}

        </div>
      </header>

      <div className="admin-dashboard-page__kpi-grid">
        <KpiCard 
          title={t('admin.kpi.totalSessions')} 
          value={kpis.totalSessions} 
          icon={Users} 
          loading={loading} 
        />
        <KpiCard 
          title={t('admin.kpi.activeSessions')} 
          value={kpis.activeSessions} 
          icon={Activity} 
          loading={loading} 
        />
        <KpiCard 
          title={t('admin.kpi.cqsAverage')} 
          value={kpis.cqsAverage} 
          icon={CheckCircle} 
          loading={loading} 
        />
        <KpiCard 
          title={t('admin.kpi.pendingReview')} 
          value={kpis.pendingReview} 
          icon={Bell} 
          loading={loading} 
        />
      </div>

      <div className="admin-dashboard-page__controls">
        <div className="search-bar">
          <Search className="search-bar__icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder={t('admin.searchPlaceholder')}
            className="search-bar__input"
          />
        </div>
        <button className="btn btn--secondary">
          <SlidersHorizontal className="btn__icon" />
          {t('admin.filters')}
        </button>
      </div>

      <SessionList 
        sessions={sessions} 
        title={t('admin.sessions.active')} 
        loading={loading}
        emptyMessage={t('admin.sessions.noActiveSessions', 'No active sessions found')}
      />
    </div>
  );
};

export default AdminDashboard;
