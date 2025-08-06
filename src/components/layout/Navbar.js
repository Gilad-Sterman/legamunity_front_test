import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, LogIn, Bell, Search, Shield, Badge, BadgeAlert, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import IconButton from '../common/IconButton';
import LanguageSelector from '../common/LanguageSelector';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSliceSupabase';

const Navbar = () => {
  // This will be connected to Redux later
  const user = useSelector(state => state.auth.user);
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login'); 
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-brand">
            <h1 className="brand-title">{t('navbar.brand')}</h1>
          </div>
          {user?.role === 'admin' && (
            <div className="header-admin-info">
              <ShieldAlert />
              <span className="admin-badge">{t('common.admin')}</span>
            </div>
          )}
          <div className="header-actions">
            {user ? (
              <div className="user-controls">
                <LanguageSelector />
                {/* <IconButton icon={Bell} text={t('common.notifications')} variant="primary" size="sm" /> */}
                {/* {user.role === 'admin' && (
                  <IconButton
                    icon={Shield}
                    text={t('sidebar.adminDashboard')}
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/admin/dashboard')}
                  />
                )} */}
                <IconButton icon={LogOut} text={t('common.logout')} variant="primary" size="sm" onClick={handleLogout}/>
              </div>
            ) : (
              <div className="user-controls">
                <LanguageSelector />
                <IconButton icon={LogOut} text={t('common.logout')} variant="primary" size="sm" onClick={handleLogout}/>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
