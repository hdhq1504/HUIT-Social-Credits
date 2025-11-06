import { ROUTE_PATHS } from '@/config/routes.config';
import { DefaultLayout, HeaderOnly } from '@/layouts';
import {
  HomePage,
  ListActivitiesPage,
  ActivityDetailPage,
  MyActivitiesPage,
  MyPointsPage,
  ProfilePage,
  RollCallPage,
  FeedbackPage,
} from '@/pages';

export const publicRoutes = [
  {
    path: ROUTE_PATHS.PUBLIC.HOME,
    component: HomePage,
    layout: DefaultLayout,
    meta: { title: 'Trang chủ' },
  },
];

export const protectedUserRoutes = [
  {
    path: ROUTE_PATHS.USER.PROFILE,
    component: ProfilePage,
    layout: HeaderOnly,
    meta: { title: 'Hồ sơ cá nhân' },
  },
  {
    path: ROUTE_PATHS.USER.ACTIVITIES,
    component: ListActivitiesPage,
    layout: DefaultLayout,
    meta: { title: 'Danh sách hoạt động' },
  },
  {
    path: ROUTE_PATHS.USER.ACTIVITY_DETAIL,
    component: ActivityDetailPage,
    layout: DefaultLayout,
    meta: { title: 'Chi tiết hoạt động' },
  },
  {
    path: ROUTE_PATHS.USER.MY_ACTIVITIES,
    component: MyActivitiesPage,
    layout: DefaultLayout,
    meta: { title: 'Hoạt động của tôi' },
  },
  {
    path: ROUTE_PATHS.USER.MY_POINTS,
    component: MyPointsPage,
    layout: DefaultLayout,
    meta: { title: 'Điểm của tôi' },
  },
  {
    path: ROUTE_PATHS.USER.ROLL_CALL,
    component: RollCallPage,
    layout: DefaultLayout,
    meta: { title: 'Điểm danh' },
  },
  {
    path: ROUTE_PATHS.USER.FEEDBACK,
    component: FeedbackPage,
    layout: DefaultLayout,
    meta: { title: 'Phản hồi' },
  },
];
