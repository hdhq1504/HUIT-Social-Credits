import { lazy } from 'react';
import { ROUTE_PATHS } from '@/config/routes.config';

const DashboardPage = lazy(() => import('@/admin/pages/DashboardPage/DashboardPage'));
const ActivitiesPage = lazy(() => import('@/admin/pages/ActivitiesPage/ActivitiesPage'));
const ScoringPage = lazy(() => import('@/admin/pages/ScoringPage/ScoringPage'));
const FeedbackPage = lazy(() => import('@/admin/pages/FeedbackPage/FeedbackPage'));
const ReportsPage = lazy(() => import('@/admin/pages/ReportsPage/ReportsPage'));
const CouncilPage = lazy(() => import('@/admin/pages/CouncilPage/CouncilPage'));
const SystemPage = lazy(() => import('@/admin/pages/SystemPage/SystemPage'));
const UsersPage = lazy(() => import('@/admin/pages/UsersPage/UsersPage'));
const StudentsPage = lazy(() => import('@/admin/pages/StudentsPage/StudentsPage'));
const LecturersPage = lazy(() => import('@/admin/pages/LecturersPage/LecturersPage'));
const AcademicYearsPage = lazy(() => import('@/admin/pages/AcademicYearsPage/AcademicYearsPage'));

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
    path: lastPathSegment(ROUTE_PATHS.ADMIN.USERS), // 'users'
    component: UsersPage,
    meta: {
      key: 'users',
      label: 'Quản lý tài khoản',
      icon: 'UserGearOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.STUDENTS), // 'students'
    component: StudentsPage,
    meta: {
      key: 'students',
      label: 'Quản lý sinh viên',
      icon: 'TeamOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.LECTURERS), // 'lecturers'
    component: LecturersPage,
    meta: {
      key: 'lecturers',
      label: 'Quản lý giảng viên',
      icon: 'UserTieOutlined',
    },
  },
  {
    path: lastPathSegment(ROUTE_PATHS.ADMIN.ACADEMIC_YEARS), // 'academic-years'
    component: AcademicYearsPage,
    meta: {
      key: 'academics',
      label: 'Cấu hình năm học',
      icon: 'CalendarAltOutlined',
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
