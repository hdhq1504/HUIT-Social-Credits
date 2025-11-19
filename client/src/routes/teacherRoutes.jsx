import { Navigate } from 'react-router-dom';
import TeacherLayout from '../teacher/layouts/TeacherLayout';
import TeacherClassesPage from '../teacher/pages/TeacherClassesPage';
import ClassStudentsPage from '../teacher/pages/ClassStudentsPage';
import StudentDetailPage from '../teacher/pages/StudentDetailPage';

export const teacherRoutes = {
  path: '/teacher',
  element: <TeacherLayout />,
  children: [
    {
      index: true,
      element: <Navigate to="/teacher/classes" replace />,
    },
    {
      path: 'classes',
      element: <TeacherClassesPage />,
    },
    {
      path: 'classes/:classId',
      element: <ClassStudentsPage />,
    },
    {
      path: 'classes/:classId/students/:studentId',
      element: <StudentDetailPage />,
    },
  ],
};
