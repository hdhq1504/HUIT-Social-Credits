import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTE_PATHS } from '@/config/routes.config';

function GuestRoute({ children }) {
  const { isLoggedIn, user } = useAuthStore();
  const location = useLocation();

  if (isLoggedIn && user) {
    const from = location.state?.from?.pathname;

    if (from) {
      return <Navigate to={from} replace />;
    }

    const redirectPath = user.role === 'ADMIN' ? ROUTE_PATHS.ADMIN.DASHBOARD : ROUTE_PATHS.PUBLIC.HOME;

    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default GuestRoute;
