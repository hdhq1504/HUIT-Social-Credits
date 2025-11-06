import { Router } from 'express';
import {
  cancelActivityRegistration,
  getActivity,
  listActivities,
  listMyActivities,
  markAttendance,
  registerForActivity,
  submitActivityFeedback,
  createActivity,
} from '../controllers/activity.controller.js';
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// ✅ THÊM ROUTE MỚI: (POST /api/activities)
// Giả định chỉ admin (đã đăng nhập) mới được tạo
router.post('/', requireAuth, createActivity);

router.get('/', optionalAuth, listActivities);
router.get('/my', requireAuth, listMyActivities);
router.get('/:id', optionalAuth, getActivity);
router.post('/:id/registrations', requireAuth, registerForActivity);
router.post('/:id/registrations/cancel', requireAuth, cancelActivityRegistration);
router.post('/:id/attendance', requireAuth, markAttendance);
router.post('/:id/feedback', requireAuth, submitActivityFeedback);

export default router;
