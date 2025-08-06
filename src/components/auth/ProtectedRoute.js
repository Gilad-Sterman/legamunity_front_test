import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute component that checks if user is authenticated
 * and has the required role before rendering children
 */
const ProtectedRoute = ({ requiredRole }) => {
  const { isAuthenticated, user, loading } = useSelector(state => state.auth);
  
  // If auth is still loading, show nothing (or could add a loading spinner here)
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If authenticated and has required role (or no role required), render children
  return <Outlet />;
};

export default ProtectedRoute;
