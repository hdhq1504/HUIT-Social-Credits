const routes = {
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

  // Admin
  adminDashboard: '/admin/dashboard',
  adminActivities: '/admin/activities',
  adminScoring: '/admin/scoring',
  adminProof: '/admin/proof',
};

export default routes;
