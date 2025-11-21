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

    // Redirect based on user role
    let redirectPath = ROUTE_PATHS.PUBLIC.HOME; // Default for SINHVIEN

    if (user.role === 'ADMIN') {
      redirectPath = ROUTE_PATHS.ADMIN.DASHBOARD;
    } else if (user.role === 'GIANGVIEN') {
      redirectPath = ROUTE_PATHS.TEACHER.CLASSES;
    }

    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default GuestRoute;
