import config from '@/config';
import {
  Gauge,
  HeartHandshake,
  CalendarCheck,
  FileText,
  MessageSquare,
  BarChart2,
  Award,
  Settings,
} from 'lucide-react';
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
    icon: Gauge,
    component: DashboardPage,
  },
  {
    key: 'activities',
    label: 'Hoạt động CTXH',
    icon: HeartHandshake,
    component: ActivitiesPage,
  },
  {
    key: 'scoring',
    label: 'Chấm điểm CTXH',
    icon: CalendarCheck,
    component: ScoringPage,
  },
  {
    key: 'proof',
    label: 'Minh chứng CTXH',
    icon: FileText,
    component: ProofPage,
  },
  {
    key: 'feedback',
    label: 'Phản hồi sinh viên',
    icon: MessageSquare,
    component: AdminFeedbackPage,
  },
  {
    key: 'reports',
    label: 'Báo cáo & thống kê',
    icon: BarChart2,
    component: ReportsPage,
  },
  {
    key: 'council',
    label: 'Hội đồng xét điểm',
    icon: Award,
    component: CouncilPage,
  },
  {
    key: 'system',
    label: 'Quản lý hệ thống',
    icon: Settings,
    component: SystemPage,
  },
];

const adminRoutes = baseAdminRoutes.map(({ key, ...route }) => ({
  path: key,
  fullPath: adminRoutePaths[key] ?? `/admin/${key}`,
  ...route,
}));

export default adminRoutes;
