import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import type { RoleType } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: RoleType[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role.slug)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
