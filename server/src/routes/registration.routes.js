import { Router } from 'express';
import {
  listRegistrationsAdmin,
  getRegistrationDetailAdmin,
  decideRegistrationAttendance,
} from '../controllers/activity/activity-registrations.controller.js';
import { requireAuth, requireRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireRoles('ADMIN', 'GIANGVIEN'), listRegistrationsAdmin);
router.get('/:id', requireRoles('ADMIN', 'GIANGVIEN'), getRegistrationDetailAdmin);
router.post('/:id/decision', requireRoles('ADMIN', 'GIANGVIEN'), decideRegistrationAttendance);

export default router;
