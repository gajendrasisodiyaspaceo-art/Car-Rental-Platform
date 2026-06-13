import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  branchBodySchema,
} from '../controllers/branch.controller';

const router = Router();

router.get('/', asyncHandler(listBranches));
router.post(
  '/',
  authenticate,
  authorize('provider', 'staff'),
  validate(branchBodySchema),
  asyncHandler(createBranch),
);
router.put('/:id', authenticate, authorize('provider', 'staff'), asyncHandler(updateBranch));
router.delete('/:id', authenticate, authorize('provider', 'staff'), asyncHandler(deleteBranch));

export default router;
