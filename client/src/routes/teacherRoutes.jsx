import { lazy } from 'react';
import { faChalkboardUser, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

const TeacherClassDetailPage = lazy(() => import('../teacher/pages/TeacherClassDetailPage'));
const TeacherStudentDetailPage = lazy(() => import('../teacher/pages/TeacherStudentDetailPage'));
const TeacherActivitiesPage = lazy(() => import('../teacher/pages/TeacherActivitiesPage/TeacherActivitiesPage'));
const TeacherActivitiesAddEditPage = lazy(
  () => import('../teacher/pages/TeacherActivitiesAddEditPage/TeacherActivitiesAddEditPage'),
);
const TeacherActivitiesDetailPage = lazy(
  () => import('../teacher/pages/TeacherActivitiesDetailPage/TeacherActivitiesDetailPage'),
);

const teacherRoutes = [
  {
    path: 'classes',
    component: TeacherClassDetailPage,
    meta: {
      label: 'Lớp chủ nhiệm',
      icon: faChalkboardUser,
    },
  },
  {
    path: 'classes/:classId/students',
    component: TeacherStudentDetailPage,
    meta: {
      label: 'Danh sách sinh viên',
      hideInSidebar: true,
    },
  },
  {
    path: 'activities',
    component: TeacherActivitiesPage,
    meta: {
      label: 'Quản lý hoạt động',
      icon: faCalendarCheck,
    },
  },
  {
    path: 'activities/create',
    component: TeacherActivitiesAddEditPage,
    meta: {
      label: 'Tạo hoạt động mới',
      hideInSidebar: true,
    },
  },
  {
    path: 'activities/:id',
    component: TeacherActivitiesDetailPage,
    meta: {
      label: 'Chi tiết hoạt động',
      hideInSidebar: true,
    },
  },
  {
    path: 'activities/:id/edit',
    component: TeacherActivitiesAddEditPage,
    meta: {
      label: 'Chỉnh sửa hoạt động',
      hideInSidebar: true,
    },
  },
];

export default teacherRoutes;
