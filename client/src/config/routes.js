const userRoutes = {
  home: '/',
  login: '/login',
  forgotPassword: '/forgot-password',

  // Sinh viên
  profile: '/profile',
  listActivities: '/list-activities',
  activityDetail: '/activity-detail',
  activityDetailWithId: '/activity-detail/:id',
  myActivities: '/my-activities',
  myPoints: '/my-points',
  rollCall: '/roll-call',
  feedback: '/feedback',
  loading: '/loading',
};

const ADMIN_ROOT = '/admin';

const adminRoutes = {
  root: ADMIN_ROOT,
  dashboard: `${ADMIN_ROOT}/dashboard`,
  activities: `${ADMIN_ROOT}/activities`,
  scoring: `${ADMIN_ROOT}/scoring`,
  proof: `${ADMIN_ROOT}/proof`,
  feedback: `${ADMIN_ROOT}/feedback`,
  reports: `${ADMIN_ROOT}/reports`,
  council: `${ADMIN_ROOT}/council`,
  system: `${ADMIN_ROOT}/system`,
};

const routes = {
  ...userRoutes,
  ...adminRoutes,
  user: userRoutes,
  admin: adminRoutes,
};

export { userRoutes, adminRoutes };
export default routes;
