import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTE_PATHS } from '@/config/routes.config';

/**
 * Route guard cho các trang dành cho khách (chưa đăng nhập).
 * Chuyển hướng người dùng đã đăng nhập đến trang phù hợp với role.
 *
 * @param {Object} props - Props của component.
 * @param {React.ReactNode} props.children - Component con (trang khách).
 * @returns {React.ReactElement} Component con hoặc Navigate component.
 *
 * @example
 * <GuestRoute>
 *   <LoginPage />
 * </GuestRoute>
 */
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
