import config from '../config';
import Home from '../pages/Home';
import LoginPage from '../pages/LoginPage/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage/ForgotPasswordPage';
import InfomationPage from '../pages/InfomationPage/InfomationPage';
import HeaderOnly from '../layouts/HeaderOnly/HeaderOnly';
import Loading from '../pages/Loading/Loading';

// Sử dụng cho những route không cần đăng nhập nhưng vẫn xem được
const publicRoutes = [
  { path: config.routes.home, component: Home },

  { path: config.routes.login, component: LoginPage },
  { path: config.routes.forgotPassword, component: ForgotPasswordPage },
  { path: config.routes.infomation, component: InfomationPage, layout: HeaderOnly },
  { path: config.routes.loading, component: Loading },
];

// Sử dụng cho route bắt buộc đăng nhập mới xem được
const privateRoutes = [];

export { privateRoutes, publicRoutes };
