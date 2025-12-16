import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTE_PATHS } from '@/config/routes.config';

/**
 * Route guard bảo vệ các trang yêu cầu xác thực.
 * Chuyển hướng đến trang login nếu chưa đăng nhập.
 * Chuyển hướng đến trang phù hợp nếu không có quyền truy cập.
 *
 * @param {Object} props - Props của component.
 * @param {React.ReactNode} props.children - Component con được bảo vệ.
 * @param {string[]} [props.allowedRoles=[]] - Danh sách role được phép truy cập.
 * @returns {React.ReactElement} Component con hoặc Navigate component.
 *
 * @example
 * <ProtectedRoute allowedRoles={['ADMIN']}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 */
function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isLoggedIn, user } = useAuthStore();
  const location = useLocation();

  if (isLoggedIn && !user) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="Đang xác thực..." />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to={ROUTE_PATHS.PUBLIC.LOGIN} state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to appropriate page based on user role
    let redirectPath = ROUTE_PATHS.PUBLIC.HOME;

    if (user?.role === 'ADMIN') {
      redirectPath = ROUTE_PATHS.ADMIN.DASHBOARD;
    } else if (user?.role === 'GIANGVIEN') {
      redirectPath = ROUTE_PATHS.TEACHER.CLASSES;
    }

    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default ProtectedRoute;
