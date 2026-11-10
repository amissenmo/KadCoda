import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';

const GuardLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#E8EDF5]">
    <Spinner className="text-primary-600 h-40 w-40" />
  </div>
);

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <GuardLoader />;
  }

  if (!isAuthenticated) {
    const redirectTarget = encodeURIComponent(
      `${location.pathname}${location.search}`,
    );
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  return children || <Outlet />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <GuardLoader />;
  }

  if (!isAuthenticated) {
    const redirectTarget = encodeURIComponent(
      `${location.pathname}${location.search}`,
    );
    return <Navigate to={`/login?redirect=${redirectTarget}`} replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/panel" replace />;
  }

  return children || <Outlet />;
}

export { AdminRoute, ProtectedRoute };
