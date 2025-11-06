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
    return <Navigate to={ROUTE_PATHS.PUBLIC.HOME} replace />;
  }

  return children;
}

export default ProtectedRoute;
