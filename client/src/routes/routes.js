import config from '../config';
import {
  ActivityDetailPage,
  FeedbackPage,
  ForgotPasswordPage,
  HomePage,
  ListActivitiesPage,
  Loading,
  LoginPage,
  MyActivitiesPage,
  MyPointsPage,
  ProfilePage,
  RollCallPage,
} from '@pages/index';
import HeaderOnly from '@layouts/index';

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

export { publicRoutes };
