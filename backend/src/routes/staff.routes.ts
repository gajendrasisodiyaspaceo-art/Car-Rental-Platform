import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  createStaffSchema,
  updateStaffSchema,
} from '../controllers/staff.controller';

const router = Router();

router.use(authenticate, authorize('provider'));

router.get('/', asyncHandler(listStaff));
router.post('/', validate(createStaffSchema), asyncHandler(createStaff));
router.patch('/:id', validate(updateStaffSchema), asyncHandler(updateStaff));
router.delete('/:id', asyncHandler(deleteStaff));

export default router;
