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
import { DefaultLayout, HeaderOnly } from '@layouts';

const userRoutePaths = config.routes.user ?? {};
const getUserRoute = (key) => userRoutePaths[key] ?? config.routes[key];

const publicRoutes = [
  { path: getUserRoute('home'), component: HomePage, layout: DefaultLayout },
  { path: getUserRoute('login'), component: LoginPage },
  { path: getUserRoute('forgotPassword'), component: ForgotPasswordPage },
  { path: getUserRoute('profile'), component: ProfilePage, layout: HeaderOnly },
  { path: getUserRoute('listActivities'), component: ListActivitiesPage, layout: DefaultLayout },
  { path: getUserRoute('activityDetail'), component: ActivityDetailPage, layout: DefaultLayout },
  { path: getUserRoute('activityDetailWithId'), component: ActivityDetailPage, layout: DefaultLayout },
  { path: getUserRoute('myActivities'), component: MyActivitiesPage, layout: DefaultLayout },
  { path: getUserRoute('myPoints'), component: MyPointsPage, layout: DefaultLayout },
  { path: getUserRoute('rollCall'), component: RollCallPage, layout: DefaultLayout },
  { path: getUserRoute('feedback'), component: FeedbackPage, layout: DefaultLayout },
  { path: getUserRoute('loading'), component: Loading },
];

export { publicRoutes };
