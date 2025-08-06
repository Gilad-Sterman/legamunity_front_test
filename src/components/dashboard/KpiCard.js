import React from 'react';
import { Zap } from 'lucide-react'; // Example icon

const KpiCard = ({ title, value, icon, trend }) => {
  const Icon = icon || Zap;

  return (
    <div className="kpi-card">
      <div className="kpi-card__header">
        <h3 className="kpi-card__title">{title}</h3>
        <Icon className="kpi-card__icon" />
      </div>
      <div className="kpi-card__body">
        <p className="kpi-card__value">{value}</p>
        {trend && <p className="kpi-card__trend">{trend}</p>}
      </div>
    </div>
  );
};

export default KpiCard;
