import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, Calendar, Mic, LogOut, User, TrendingUp, Settings, BookCheck } from 'lucide-react';
import IconNav from '../common/IconNav';
import { logout } from '../../store/slices/authSliceSupabase';
import IconButton from '../common/IconButton';

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Admin-focused navigation - main workflow
  const adminNavigation = [
    { name: t('sidebar.adminDashboard'), href: '/admin/dashboard', icon: LayoutDashboard },
    // { name: t('sidebar.scheduleInterview'), href: '/admin/schedule', icon: CalendarPlus },
    { name: t('sidebar.sessions'), href: '/admin/sessions', icon: Calendar },
    { name: t('sidebar.fullLifeStories'), href: '/admin/full-life-stories', icon: BookCheck },
    // { name: t('sidebar.drafts'), href: '/admin/drafts', icon: FileText },
  ];

  // Secondary admin tools
  const adminToolsNavigation = [
    { name: t('sidebar.settings'), href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-container">
        <div className="sidebar-header">
          <div className="logo-container">
            {/* {<img
              className="logo"
              src="/logo.svg"
              alt="Legamunity"
            />} */}
            <span className="logo-text">{t('navbar.brand')}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <IconNav items={adminNavigation} title={t('sidebar.admin', 'Admin')} className="admin-section" />
              <IconNav items={adminToolsNavigation} title={t('sidebar.tools', 'Tools')} className="admin-tools-section" />
            </>
          ) : (
            <div className="access-denied">
              <p>{t('common.accessDenied', 'Access denied. Admin privileges required.')}</p>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-info">
              <p className="user-name">
                {user?.displayName || t('common.guest')}
              </p>
              <p className="user-role">
                {user?.role ? t(`common.${user.role}`) : t('common.notLoggedIn')}
              </p>
            </div>
          </div>

          {isAuthenticated && (
            <IconButton
              icon={LogOut}
              variant="primary"
              size="sm"
              onClick={handleLogout}
              className="logout-button flex items-center mt-4 px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-100 w-full"
            />
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
