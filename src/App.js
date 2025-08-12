import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from './store/slices/authSliceSupabase';
import './i18n'; // Import i18n configuration

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

// Admin Pages
import ScheduleInterview from './pages/admin/ScheduleInterview';
import Sessions from './pages/admin/Sessions';
import FullLifeStories from './pages/admin/FullLifeStories';
import UserManagement from './pages/admin/UserManagement';
import Conflicts from './pages/admin/Conflicts';
import Analytics from './pages/admin/Analytics';
import ProjectProgress from './pages/admin/ProjectProgress';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// SCSS is now imported in index.js



function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check authentication status when app loads
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes for all authenticated users - wrapped in Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Route>
        
        {/* Protected routes for admin users only - wrapped in Layout */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<Layout />}>
            {/* Main admin workflow */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/schedule" element={<ScheduleInterview />} />
            <Route path="/admin/sessions" element={<Sessions />} />
            <Route path="/admin/full-life-stories" element={<FullLifeStories />} />
            
            {/* Admin tools */}
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/conflicts" element={<Conflicts />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/progress" element={<ProjectProgress />} />
          </Route>
        </Route>
        
        {/* Redirect routes */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
