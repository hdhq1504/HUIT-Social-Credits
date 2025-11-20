import { faChalkboardUser, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import TeacherClassDetailPage from '../teacher/pages/TeacherClassDetailPage';
import TeacherStudentDetailPage from '../teacher/pages/TeacherStudentDetailPage';
import TeacherActivitiesPage from '../teacher/pages/TeacherActivitiesPage/TeacherActivitiesPage';
import TeacherActivitiesAddEditPage from '../teacher/pages/TeacherActivitiesAddEditPage/TeacherActivitiesAddEditPage';
import TeacherActivitiesDetailPage from '../teacher/pages/TeacherActivitiesDetailPage/TeacherActivitiesDetailPage';

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
