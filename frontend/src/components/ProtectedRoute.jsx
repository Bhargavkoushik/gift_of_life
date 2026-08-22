import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-red border-t-transparent"></div>
          <span className="text-sm font-medium text-slate-500">Restoring auth session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, but preserve current location to return after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !user.is_verified && location.pathname !== '/verify-account') {
    return <Navigate to="/verify-account" replace />;
  }

  const isAllowed = requiredRole 
    ? (requiredRole === 'SUPER_ADMIN' 
        ? (roles.includes('SUPER_ADMIN') || roles.includes('ADMIN')) 
        : roles.includes(requiredRole))
    : true;

  if (requiredRole && !isAllowed) {
    // Authenticated, but lacks required role to view this workspace
    return <Navigate to="/select-role" replace />;
  }

  return children;
}
