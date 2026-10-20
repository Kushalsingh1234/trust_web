import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import TrustLogo from './TrustLogo';

export const ProtectedRoute = ({ children, message = 'आगे बढ़ने के लिए कृपया लॉगिन करें (Please sign in to continue)' }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <TrustLogo className="w-14 h-14 animate-pulse" showText={false} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location, message }} 
        replace 
      />
    );
  }

  return children;
};

export default ProtectedRoute;
