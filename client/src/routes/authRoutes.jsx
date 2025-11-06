import { ROUTE_PATHS } from '@/config/routes.config';
import { LoginPage, ForgotPasswordPage, Loading } from '@/pages';

export const authRoutes = [
  {
    path: ROUTE_PATHS.PUBLIC.LOGIN,
    component: LoginPage,
    meta: { title: 'Đăng nhập' },
  },
  {
    path: ROUTE_PATHS.PUBLIC.FORGOT_PASSWORD,
    component: ForgotPasswordPage,
    meta: { title: 'Quên mật khẩu' },
  },
  {
    path: ROUTE_PATHS.PUBLIC.LOADING,
    component: Loading,
    meta: { title: 'Đang tải...' },
  },
];

export default authRoutes;
