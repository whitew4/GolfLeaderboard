// src/components/routing/RequireAdmin.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const RequireAdmin: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const role  = localStorage.getItem('userRole'); // 'admin' | 'player'

  if (!token) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return children;
};

export default RequireAdmin;
