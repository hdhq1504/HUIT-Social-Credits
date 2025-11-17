import { ROUTE_PATHS } from '@/config/routes.config';
import {
  DashboardPage,
  ActivitiesPage,
  ScoringPage,
  FeedbackPage,
  ReportsPage,
  CouncilPage,
  SystemPage,
  UsersPage,
  AcademicSettingsPage,
} from '@/admin/pages';

const lastPathSegment = (path) => path.split('/').pop();

export const adminRoutes = [
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.DASHBOARD), // 'dashboard'
    component: DashboardPage,
    meta: {
      key: 'dashboard',
      label: 'Bảng điều khiển',
      icon: 'DashboardOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.ACTIVITIES), // 'activities'
    component: ActivitiesPage,
    meta: {
      key: 'activities',
      label: 'Hoạt động CTXH',
      icon: 'CalendarOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.SCORING), // 'scoring'
    component: ScoringPage,
    meta: {
      key: 'scoring',
      label: 'Điểm & Minh chứng',
      icon: 'TrophyOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.FEEDBACK), // 'feedback'
    component: FeedbackPage,
    meta: {
      key: 'feedback',
      label: 'Phản hồi sinh viên',
      icon: 'MessageOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.REPORTS), // 'reports'
    component: ReportsPage,
    meta: {
      key: 'reports',
      label: 'Báo cáo & thống kê',
      icon: 'BarChartOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.COUNCIL), // 'council'
    component: CouncilPage,
    meta: {
      key: 'council',
      label: 'Hội đồng xét điểm',
      icon: 'TeamOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.ACADEMIC_SETTINGS),
    component: AcademicSettingsPage,
    meta: {
      key: 'academic-settings',
      label: 'Cấu hình học kỳ',
      icon: 'BookOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.USERS), // 'users'
    component: UsersPage,
    meta: {
      key: 'users',
      label: 'Quản lý người dùng',
      icon: 'UserGearOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.SYSTEM), // 'system'
    component: SystemPage,
    meta: {
      key: 'system',
      label: 'Quản lý hệ thống',
      icon: 'SettingOutlined',
    },
  },
];

export default adminRoutes;
