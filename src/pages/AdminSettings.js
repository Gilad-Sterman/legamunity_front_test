import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Users, Shield, Bell, Lock, Mail } from 'lucide-react';

const AdminSettings = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');

  // Mock users for demonstration
  const mockUsers = [
    { id: 1, name: 'David Cohen', email: 'david@example.com', role: 'admin', status: 'active', lastLogin: '2025-08-25T10:30:00' },
    { id: 2, name: 'Sarah Levy', email: 'sarah@example.com', role: 'editor', status: 'active', lastLogin: '2025-08-24T14:15:00' },
    { id: 3, name: 'Michael Ben-David', email: 'michael@example.com', role: 'viewer', status: 'inactive', lastLogin: '2025-08-20T09:45:00' },
    { id: 4, name: 'Rachel Goldstein', email: 'rachel@example.com', role: 'editor', status: 'active', lastLogin: '2025-08-26T08:20:00' },
    { id: 5, name: 'Yossi Avraham', email: 'yossi@example.com', role: 'viewer', status: 'pending', lastLogin: null },
  ];

  // Mock settings tabs
  const tabs = [
    { id: 'users', name: t('admin.settings.tabs.users', 'Users'), icon: Users },
    { id: 'permissions', name: t('admin.settings.tabs.permissions', 'Permissions'), icon: Shield },
    { id: 'notifications', name: t('admin.settings.tabs.notifications', 'Notifications'), icon: Bell },
    { id: 'security', name: t('admin.settings.tabs.security', 'Security'), icon: Lock },
    { id: 'email', name: t('admin.settings.tabs.email', 'Email Templates'), icon: Mail },
  ];

  // Format date to local string
  const formatDate = (dateString) => {
    if (!dateString) return t('admin.settings.users.never');
    return new Date(dateString).toLocaleString();
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'admin-settings-page__status-badge--active';
      case 'inactive': return 'admin-settings-page__status-badge--inactive';
      case 'pending': return 'admin-settings-page__status-badge--pending';
      default: return '';
    }
  };

  // Get role badge class
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'admin-settings-page__role-badge--admin';
      case 'editor': return 'admin-settings-page__role-badge--editor';
      case 'viewer': return 'admin-settings-page__role-badge--viewer';
      default: return '';
    }
  };

  return (
    <div className="admin-settings-page">
      <header className="admin-settings-page__header">
        <div className="admin-settings-page__header-icon">
          <Settings size={24} />
        </div>
        <div className="admin-settings-page__header-content">
          <h1 className="admin-settings-page__title">{t('admin.settings.title', 'System Settings')}</h1>
          <p className="admin-settings-page__subtitle">{t('admin.settings.subtitle', 'Manage system settings and user access')}</p>
        </div>
      </header>

      <div className="admin-settings-page__content">
        <div className="admin-settings-page__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-settings-page__tab ${activeTab === tab.id ? 'admin-settings-page__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {React.createElement(tab.icon, { size: 16 })}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        <div className="admin-settings-page__tab-content">
          {activeTab === 'users' && (
            <div className="admin-settings-page__users">
              <div className="admin-settings-page__section-header">
                <h2 className="admin-settings-page__section-title">{t('admin.settings.users.title', 'User Management')}</h2>
                <button className="admin-settings-page__add-button">
                  {t('admin.settings.users.addUser', 'Add User')}
                </button>
              </div>
              
              <div className="admin-settings-page__table-container">
                <table className="admin-settings-page__table">
                  <thead>
                    <tr>
                      <th>{t('admin.settings.users.name', 'Name')}</th>
                      <th>{t('admin.settings.users.email', 'Email')}</th>
                      <th>{t('admin.settings.users.role', 'Role')}</th>
                      <th>{t('admin.settings.users.status', 'Status')}</th>
                      <th>{t('admin.settings.users.lastLogin', 'Last Login')}</th>
                      <th>{t('admin.settings.users.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`admin-settings-page__role-badge ${getRoleBadgeClass(user.role)}`}>
                            {t(`admin.settings.users.roles.${user.role}`, user.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-settings-page__status-badge ${getStatusBadgeClass(user.status)}`}>
                            {t(`admin.settings.users.statuses.${user.status}`, user.status)}
                          </span>
                        </td>
                        <td>{formatDate(user.lastLogin)}</td>
                        <td>
                          <div className="admin-settings-page__actions">
                            <button className="admin-settings-page__action-button admin-settings-page__action-button--edit">
                              {t('admin.settings.users.edit', 'Edit')}
                            </button>
                            <button className="admin-settings-page__action-button admin-settings-page__action-button--delete">
                              {t('admin.settings.users.delete', 'Delete')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="admin-settings-page__note">
                <p>{t('admin.settings.users.note', 'Note: This is a mock interface for demonstration purposes. User management functionality will be implemented in Phase 2.')}</p>
              </div>
            </div>
          )}

          {activeTab !== 'users' && (
            <div className="admin-settings-page__placeholder">
              <div className="admin-settings-page__placeholder-icon">
                {React.createElement(tabs.find(tab => tab.id === activeTab)?.icon || Settings, { size: 48 })}
              </div>
              <h3 className="admin-settings-page__placeholder-title">
                {t('admin.settings.comingSoon', 'Coming Soon')}
              </h3>
              <p className="admin-settings-page__placeholder-text">
                {t('admin.settings.featureImplementation', 'This feature will be implemented in Phase 2 of the project.')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
