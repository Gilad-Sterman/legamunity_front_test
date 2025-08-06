import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

const Analytics = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">{t('sidebar.analytics')}</h1>
      </header>

      <div className="admin-page__content">
        <div className="placeholder-content">
          <BarChart3 className="placeholder-icon" size={64} />
          <h2>Analytics Dashboard</h2>
          <p>This page will contain the analytics and reporting interface.</p>
          <p>Features to implement:</p>
          <ul>
            <li>Interview completion statistics</li>
            <li>Performance metrics and KPIs</li>
            <li>Quality scores and trends</li>
            <li>Export and reporting tools</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
