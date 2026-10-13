import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, loading, children }) => {
  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" style={{ width: '36px', height: '36px', borderTopColor: '#6366f1' }}></div>
        <p>Verifying customer session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
