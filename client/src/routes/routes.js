import config from '../config';
import Home from '../pages/Home';
import LoginPage from '../pages/LoginPage/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage/ForgotPasswordPage';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import ListActivitiesPage from '../pages/ListActivitiesPage/ListActivitiesPage';
import ActivityDetailPage from '../pages/ActivityDetailPage/ActivityDetailPage';
import HeaderOnly from '../layouts/HeaderOnly/HeaderOnly';
import Loading from '../pages/Loading/Loading';

// Sử dụng cho những route không cần đăng nhập nhưng vẫn xem được
const publicRoutes = [
  { path: config.routes.home, component: Home },
  { path: config.routes.login, component: LoginPage },
  { path: config.routes.forgotPassword, component: ForgotPasswordPage },
  { path: config.routes.profile, component: ProfilePage, layout: HeaderOnly },
  { path: config.routes.listActivities, component: ListActivitiesPage },
  { path: config.routes.activityDetail, component: ActivityDetailPage },
  { path: config.routes.activityDetailWithId, component: ActivityDetailPage },
  { path: config.routes.loading, component: Loading },
];

// Sử dụng cho route bắt buộc đăng nhập mới xem được
const privateRoutes = [];

export { privateRoutes, publicRoutes };
