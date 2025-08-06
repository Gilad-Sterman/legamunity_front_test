import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserPlus, Edit, Trash2 } from 'lucide-react';

const UserManagement = () => {
  const { t } = useTranslation();

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1 className="admin-page__title">{t('sidebar.users')}</h1>
      </header>

      <div className="admin-page__content">
        <div className="placeholder-content">
          <Users className="placeholder-icon" size={64} />
          <h2>User Management</h2>
          <p>This page will contain the user management interface.</p>
          <p>Features to implement:</p>
          <ul>
            <li>User list and search</li>
            <li>Add/edit/delete users</li>
            <li>Role management</li>
            <li>User status controls</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
