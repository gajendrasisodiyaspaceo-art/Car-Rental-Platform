import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  categoryBodySchema,
  categoryUpdateSchema,
} from '../controllers/category.controller';

const router = Router();

router.get('/', asyncHandler(listCategories));
router.post(
  '/',
  authenticate,
  authorize('provider', 'staff'),
  validate(categoryBodySchema),
  asyncHandler(createCategory),
);
router.put(
  '/:id',
  authenticate,
  authorize('provider', 'staff'),
  validate(categoryUpdateSchema),
  asyncHandler(updateCategory),
);
router.delete('/:id', authenticate, authorize('provider', 'staff'), asyncHandler(deleteCategory));

export default router;
