import { faChalkboardUser } from '@fortawesome/free-solid-svg-icons';
import TeacherClassesPage from '../teacher/pages/TeacherClassesPage';

const teacherRoutes = [
  {
    path: 'classes',
    component: TeacherClassesPage,
    meta: {
      label: 'Lớp chủ nhiệm',
      icon: faChalkboardUser,
    },
  },
];

export default teacherRoutes;
