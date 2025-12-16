import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Loading from '../../user/pages/Loading/Loading';
import { ROUTE_PATHS } from '@/config/routes.config';

/**
 * Route guard chỉ cho phép Admin truy cập.
 * Chuyển hướng đến trang login nếu chưa đăng nhập hoặc không có quyền admin.
 *
 * @param {Object} props - Props của component.
 * @param {React.ReactNode} props.children - Component con được bảo vệ.
 * @returns {React.ReactElement} Component con hoặc Navigate/Loading component.
 *
 * @example
 * <AdminRoute>
 *   <AdminDashboard />
 * </AdminRoute>
 */
function AdminRoute({ children }) {
  const { isLoggedIn, user } = useAuthStore();

  // Đang load thông tin user
  if (isLoggedIn && !user) {
    return <Loading message="Đang xác thực..." />;
  }

  // Chưa đăng nhập
  if (!isLoggedIn) {
    return <Navigate to={ROUTE_PATHS.PUBLIC.LOGIN} replace />;
  }

  // Đã đăng nhập nhưng không phải admin
  if (user?.role !== 'ADMIN') {
    return <Navigate to={ROUTE_PATHS.PUBLIC.LOGIN} replace />;
  }

  // Là admin, cho phép truy cập
  return children;
}

export default AdminRoute;
