import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import { CircularProgress, Box } from '@mui/material';

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuthStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    loading: state.loading,
  }));
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
