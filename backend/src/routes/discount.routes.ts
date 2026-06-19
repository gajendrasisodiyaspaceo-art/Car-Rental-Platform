import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listDiscounts,
  listActiveDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  discountBodySchema,
} from '../controllers/discount.controller';

const router = Router();

// Public: active promo codes (for the customer app).
router.get('/active', asyncHandler(listActiveDiscounts));

// Provider-managed.
router.use(authenticate, authorize('provider', 'staff'));
router.get('/', asyncHandler(listDiscounts));
router.post('/', validate(discountBodySchema), asyncHandler(createDiscount));
router.put('/:id', asyncHandler(updateDiscount));
router.delete('/:id', asyncHandler(deleteDiscount));

export default router;
