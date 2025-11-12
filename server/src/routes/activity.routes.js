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
  updateActivity,
  deleteActivity,
  listActivityRegistrationsAdmin
} from '../controllers/activity.controller.js';
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
