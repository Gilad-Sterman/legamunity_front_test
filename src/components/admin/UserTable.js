import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Edit2, Check, X } from 'lucide-react';
import { toggleAdminUserStatus, deleteAdminUser, updateAdminUserDisplayName } from '../../store/slices/adminSlice';

const UserTable = ({ users }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [editingUser, setEditingUser] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleToggleStatus = (uid, currentStatus) => {
    dispatch(toggleAdminUserStatus({ uid, disabled: !currentStatus }));
  };

  const handleDelete = (uid) => {
    if (window.confirm(t('admin.confirmations.deleteUser'))) {
      dispatch(deleteAdminUser(uid));
    }
  };

  const handleEditStart = (user) => {
    setEditingUser(user.uid);
    setEditValue(user.displayName || '');
  };

  const handleEditSave = (uid) => {
    if (editValue.trim()) {
      dispatch(updateAdminUserDisplayName({ uid, displayName: editValue.trim() }));
    }
    setEditingUser(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingUser(null);
    setEditValue('');
  };

  if (!users || users.length === 0) {
    return <div className="no-users-message">{t('admin.noUsers')}</div>;
  }

  return (
    <div className="table-container">
      <table className="user-table">
        <thead>
          <tr>
            <th>{t('admin.table.email')}</th>
            <th>{t('admin.table.displayName')}</th>
            <th>{t('admin.table.status')}</th>
            <th>{t('admin.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid}>
              <td className="user-email">{user.email}</td>
              <td className="user-name">
                {editingUser === user.uid ? (
                  <div className="edit-name-container">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="edit-name-input"
                      placeholder={t('admin.placeholders.enterDisplayName')}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleEditSave(user.uid);
                        if (e.key === 'Escape') handleEditCancel();
                      }}
                      autoFocus
                    />
                    <div className="edit-name-actions">
                      <button
                        onClick={() => handleEditSave(user.uid)}
                        className="edit-btn save-btn"
                        title={t('admin.actions.save')}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="edit-btn cancel-btn"
                        title={t('admin.actions.cancel')}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="display-name-container">
                    <span>{user.displayName || t('admin.placeholders.noDisplayName')}</span>
                    <button
                      onClick={() => handleEditStart(user)}
                      className="edit-btn edit-trigger-btn"
                      title={t('admin.actions.edit')}
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                )}
              </td>
              <td className="user-status">
                <span className={`status-badge ${user.disabled ? 'status-disabled' : 'status-enabled'}`}>
                  {user.disabled ? t('admin.status.disabled') : t('admin.status.enabled')}
                </span>
              </td>
              <td className="user-actions">
                <button 
                  onClick={() => handleToggleStatus(user.uid, user.disabled)}
                  className={`action-btn ${user.disabled ? 'btn-enable' : 'btn-disable'}`}
                >
                  {user.disabled ? t('admin.actions.enable') : t('admin.actions.disable')}
                </button>
                <button 
                  onClick={() => handleDelete(user.uid)}
                  className="action-btn btn-delete"
                >
                  {t('admin.actions.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
