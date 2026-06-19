import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { deleteReview } from '../controllers/review.controller';

const router = Router();

// Moderation: owning provider or admin can remove a review.
router.delete('/:id', authenticate, authorize('provider', 'staff', 'admin'), asyncHandler(deleteReview));

export default router;
