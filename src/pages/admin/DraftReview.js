import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Edit, Eye, MessageSquare } from 'lucide-react';

const DraftReview = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">{t('sidebar.draftReview')}</h1>
      </header>

      <div className="admin-page__content">
        <div className="placeholder-content">
          <FileText className="placeholder-icon" size={64} />
          <h2>Draft Review</h2>
          <p>This page will contain the draft review interface.</p>
          <p>Features to implement:</p>
          <ul>
            <li>Interview transcript review</li>
            <li>Edit and annotation tools</li>
            <li>Comment and feedback system</li>
            <li>Approval workflow</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DraftReview;
