import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  // 1. While the auth state is loading, show a loading indicator
  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  // 2. Once loading is false, check if a user exists
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 3. If loading is false and a user exists, show the page
  return children;
};

export default ProtectedRoute;