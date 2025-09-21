import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: JSX.Element;
  requireAdmin?: boolean;
}) {
  const token = localStorage.getItem('authToken');
  const role  = localStorage.getItem('userRole'); // 'admin' | 'player'

  // not logged in → kick to login
  if (!token) return <Navigate to="/login" replace />;

  // admin-only route
  if (requireAdmin && role !== 'admin') return <Navigate to="/" replace />;

  return children;
}
