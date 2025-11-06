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
    PROOF: '/admin/proof',
    FEEDBACK: '/admin/feedback',
    REPORTS: '/admin/reports',
    COUNCIL: '/admin/council',
    SYSTEM: '/admin/system',
  },
};

// Helper functions để tạo dynamic paths
export const buildPath = {
  activityDetail: (id) => `/activities/${id}`,
  adminActivityDetail: (id) => `/admin/activities/${id}`,
  adminActivityEdit: (id) => `/admin/activities/${id}/edit`,
};

export default ROUTE_PATHS;