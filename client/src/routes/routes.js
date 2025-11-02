import config from '../config';
import ActivityDetailPage from '../pages/ActivityDetailPage/ActivityDetailPage';
import FeedbackPage from '../pages/FeedbackPage/FeedbackPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage/ForgotPasswordPage';
import ListActivitiesPage from '../pages/ListActivitiesPage/ListActivitiesPage';
import Loading from '../pages/Loading/Loading';
import HomePage from '../pages/HomePage/HomePage';
import LoginPage from '../pages/LoginPage/LoginPage';
import MyActivitiesPage from '../pages/MyActivitiesPage/MyActivitiesPage';
import MyPointsPage from '../pages/MyPointsPage/MyPointsPage';
import ProfilePage from '../pages/ProfilePage/ProfilePage';
import RollCallPage from '../pages/RollCallPage/RollCallPage';
import HeaderOnly from '../layouts/HeaderOnly/HeaderOnly';

// Sử dụng cho những route không cần đăng nhập nhưng vẫn xem được
const publicRoutes = [
  { path: config.routes.home, component: HomePage },
  { path: config.routes.login, component: LoginPage },
  { path: config.routes.forgotPassword, component: ForgotPasswordPage },
  { path: config.routes.profile, component: ProfilePage, layout: HeaderOnly },
  { path: config.routes.listActivities, component: ListActivitiesPage },
  { path: config.routes.activityDetail, component: ActivityDetailPage },
  { path: config.routes.activityDetailWithId, component: ActivityDetailPage },
  { path: config.routes.myActivities, component: MyActivitiesPage },
  { path: config.routes.myPoints, component: MyPointsPage },
  { path: config.routes.rollCall, component: RollCallPage },
  { path: config.routes.feedback, component: FeedbackPage },
  { path: config.routes.loading, component: Loading },
];

// Sử dụng cho route bắt buộc đăng nhập mới xem được
const privateRoutes = [];

export { privateRoutes, publicRoutes };
