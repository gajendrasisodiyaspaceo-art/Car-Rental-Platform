import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listUsers,
  listProviders,
  adminUpdateUser,
  platformStats,
  updateUserSchema,
} from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', asyncHandler(platformStats));
router.get('/users', asyncHandler(listUsers));
router.get('/providers', asyncHandler(listProviders));
router.patch('/users/:id', validate(updateUserSchema), asyncHandler(adminUpdateUser));

export default router;
