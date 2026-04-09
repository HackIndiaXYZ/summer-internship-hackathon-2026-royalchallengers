import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is authenticated but hasn't completed profile,
  // redirect to profile-setup (unless they are already there)
  if (!user.profileComplete && location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" replace />;
  }

  // If profile is complete and they try to go back to profile-setup via route,
  // we could let them edit (it's supported), or redirect them to dashboard.
  // For now, let's allow them to access it for editing.

  return children;
};

export default ProtectedRoute;
