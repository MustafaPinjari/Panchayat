import { Navigate } from 'react-router';
import { useAuth, type AuthUser } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: AuthUser['role'][];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
