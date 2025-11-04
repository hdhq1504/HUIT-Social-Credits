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

const adminRoutes = [
  {
    path: 'dashboard',
    label: 'Bảng điều khiển',
    icon: Gauge,
    component: DashboardPage,
  },
  {
    path: 'activities',
    label: 'Hoạt động CTXH',
    icon: HeartHandshake,
    component: ActivitiesPage,
  },
  {
    path: 'scoring',
    label: 'Chấm điểm CTXH',
    icon: CalendarCheck,
    component: ScoringPage,
  },
  {
    path: 'proof',
    label: 'Minh chứng CTXH',
    icon: FileText,
    component: ProofPage,
  },
  {
    path: 'feedback',
    label: 'Phản hồi sinh viên',
    icon: MessageSquare,
    component: AdminFeedbackPage,
  },
  {
    path: 'reports',
    label: 'Báo cáo & thống kê',
    icon: BarChart2,
    component: ReportsPage,
  },
  {
    path: 'council',
    label: 'Hội đồng xét điểm',
    icon: Award,
    component: CouncilPage,
  },
  {
    path: 'system',
    label: 'Quản lý hệ thống',
    icon: Settings,
    component: SystemPage,
  },
];

export default adminRoutes;
