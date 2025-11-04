import config from '@/config';
import {
  ActivitiesPage,
  AdminFeedbackPage,
  CouncilPage,
  DashboardPage,
  ProofPage,
  ReportsPage,
  ScoringPage,
  SystemPage,
} from '@admin/pages';

const adminRoutePaths = config.routes.admin ?? {};

const baseAdminRoutes = [
  {
    key: 'dashboard',
    label: 'Bảng điều khiển',
    component: DashboardPage,
  },
  {
    key: 'activities',
    label: 'Hoạt động CTXH',
    component: ActivitiesPage,
  },
  {
    key: 'scoring',
    label: 'Điểm & Minh chứng',
    component: ScoringPage,
  },
  {
    key: 'feedback',
    label: 'Phản hồi sinh viên',
    component: AdminFeedbackPage,
  },
  {
    key: 'reports',
    label: 'Báo cáo & thống kê',
    component: ReportsPage,
  },
  {
    key: 'council',
    label: 'Hội đồng xét điểm',
    component: CouncilPage,
  },
  {
    key: 'system',
    label: 'Quản lý hệ thống',
    component: SystemPage,
  },
];

const adminRoutes = baseAdminRoutes.map(({ key, ...route }) => ({
  path: key,
  fullPath: adminRoutePaths[key] ?? `/admin/${key}`,
  ...route,
}));

export default adminRoutes;
