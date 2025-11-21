import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTE_PATHS } from '@/config/routes.config';

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
