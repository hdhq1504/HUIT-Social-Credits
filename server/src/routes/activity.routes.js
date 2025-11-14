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
import { optionalAuth, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// CRUD hoạt động
router.post('/', requireAuth, createActivity);
router.put('/:id', requireAuth, updateActivity);
router.delete('/:id', requireAuth, deleteActivity);

router.get('/', optionalAuth, listActivities);

router.get('/my', requireAuth, listMyActivities);
router.get('/:id', optionalAuth, getActivity);
router.get('/:id/registrations', requireAuth, listActivityRegistrationsAdmin);
router.post('/:id/registrations', requireAuth, registerForActivity);
router.post('/:id/registrations/cancel', requireAuth, cancelActivityRegistration);
router.post('/:id/attendance', requireAuth, markAttendance);
router.post('/:id/feedback', requireAuth, submitActivityFeedback);

export default router;
