import { faChalkboardUser } from '@fortawesome/free-solid-svg-icons';
import TeacherClassDetailPage from '../teacher/pages/TeacherClassDetailPage';
import TeacherStudentDetailPage from '../teacher/pages/TeacherStudentDetailPage';

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
];

export default teacherRoutes;
