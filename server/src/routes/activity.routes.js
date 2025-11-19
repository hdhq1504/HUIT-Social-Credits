import { Router } from 'express';
import { getActivity, listActivities } from '../controllers/activity/activity-public.controller.js';
import {
  cancelActivityRegistration,
  listActivityRegistrationsAdmin,
  listMyActivities,
  registerForActivity,
} from '../controllers/activity/activity-registrations.controller.js';
import { markAttendance } from '../controllers/activity/activity-attendance.controller.js';
import { submitActivityFeedback } from '../controllers/activity/activity-feedback.controller.js';
import {
  createActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activity/activity-management.controller.js';
import { optionalAuth, requireAuth, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// CRUD hoạt động
router.post('/', requireRoles('ADMIN', 'GIANGVIEN'), createActivity);
router.put('/:id', requireRoles('ADMIN', 'GIANGVIEN'), updateActivity);
router.delete('/:id', requireRoles('ADMIN', 'GIANGVIEN'), deleteActivity);

router.get('/', optionalAuth, listActivities);

router.get('/my', requireAuth, listMyActivities);
router.get('/:id', optionalAuth, getActivity);
router.get('/:id/registrations', requireRoles('ADMIN', 'GIANGVIEN'), listActivityRegistrationsAdmin);
router.post('/:id/registrations', requireRoles('SINHVIEN'), registerForActivity);
router.post('/:id/registrations/cancel', requireRoles('SINHVIEN'), cancelActivityRegistration);
router.post('/:id/attendance', requireRoles('ADMIN', 'GIANGVIEN'), markAttendance);
router.post('/:id/feedback', requireRoles('SINHVIEN'), submitActivityFeedback);

export default router;
