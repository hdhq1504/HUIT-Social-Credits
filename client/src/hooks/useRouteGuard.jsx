import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import useAuthStore from '@/stores/useAuthStore';
import { ROUTE_PATHS } from '@/config/routes.config';

export const useRouteGuard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuthStore();

  const navigateWithAuth = (path, options = {}) => {
    const { requireAuth = false, requireRole = null } = options;

    if (requireAuth && !isLoggedIn) {
      message.warning('Vui lòng đăng nhập để tiếp tục');
      navigate(ROUTE_PATHS.PUBLIC.LOGIN, {
        state: { from: { pathname: path } },
      });
      return false;
    }

    if (requireRole && user?.role !== requireRole) {
      message.error('Bạn không có quyền truy cập trang này');
      navigate(ROUTE_PATHS.PUBLIC.HOME);
      return false;
    }

    navigate(path);
    return true;
  };

  const navigateToAdmin = (subPath = 'dashboard') => {
    navigateWithAuth(`${ROUTE_PATHS.ADMIN.ROOT}/${subPath}`, {
      requireAuth: true,
      requireRole: 'ADMIN',
    });
  };

  const navigateToUser = (path) => {
    navigateWithAuth(path, { requireAuth: true });
  };

  const navigateBack = (fallbackPath = ROUTE_PATHS.PUBLIC.HOME) => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return {
    navigateWithAuth,
    navigateToAdmin,
    navigateToUser,
    navigateBack,
  };
};

export default useRouteGuard;
