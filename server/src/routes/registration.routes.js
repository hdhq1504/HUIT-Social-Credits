import { Router } from 'express';
import {
  listRegistrationsAdmin,
  getRegistrationDetailAdmin,
  decideRegistrationAttendance,
} from '../controllers/activity/index.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, listRegistrationsAdmin);
router.get('/:id', requireAuth, getRegistrationDetailAdmin);
router.post('/:id/decision', requireAuth, decideRegistrationAttendance);

export default router;
