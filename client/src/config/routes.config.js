export const ROUTE_PATHS = {
  // Public routes - không cần đăng nhập
  PUBLIC: {
    HOME: '/',
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    LOADING: '/loading',
  },

  // User routes - cần đăng nhập
  USER: {
    PROFILE: '/profile',
    ACTIVITIES: '/activities',
    ACTIVITY_DETAIL: '/activities/:id',
    MY_ACTIVITIES: '/my-activities',
    MY_POINTS: '/my-points',
    ROLL_CALL: '/roll-call',
    FEEDBACK: '/feedback',
  },

  // Admin routes - cần đăng nhập + role ADMIN
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    ACTIVITIES: '/admin/activities',
    ACTIVITY_CREATE: '/admin/activities/create',
    ACTIVITY_DETAIL: '/admin/activities/:id',
    ACTIVITY_EDIT: '/admin/activities/:id/edit',
    SCORING: '/admin/scoring',
    SCORING_DETAIL: '/admin/scoring/:id',
    FEEDBACK: '/admin/feedback',
    FEEDBACK_DETAIL: '/admin/feedback/:id',
    REPORTS: '/admin/reports',
    COUNCIL: '/admin/council',
    COUNCIL_DETAIL: '/admin/council/:id',
    USERS: '/admin/users',
    USER_CREATE: '/admin/users/create',
    USER_EDIT: '/admin/users/:id/edit',
    SYSTEM: '/admin/system',
    ACADEMIC_SETTINGS: '/admin/academic-settings',
  },
};

// Helper functions để tạo dynamic paths
export const buildPath = {
  activityDetail: (id) => `/activities/${id}`,
  adminActivityDetail: (id) => `/admin/activities/${id}`,
  adminActivityEdit: (id) => `/admin/activities/${id}/edit`,
  adminFeedbackDetail: (id) => `/admin/feedback/${id}`,
  adminUserEdit: (id) => `/admin/users/${id}/edit`,
  adminScoringDetail: (id) => `/admin/scoring/${id}`,
};

export default ROUTE_PATHS;
