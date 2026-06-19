import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createBooking,
  listBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  generateAccessOtp,
  redeemAccessOtp,
  generateReturnOtp,
  redeemReturnOtp,
  createBookingSchema,
  updateStatusSchema,
  accessOtpSchema,
  cancelSchema,
} from '../controllers/booking.controller';
import { payBooking, paySchema } from '../controllers/payment.controller';
import { createReview, reviewSchema } from '../controllers/review.controller';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(listBookings));
router.post('/', authorize('customer'), validate(createBookingSchema), asyncHandler(createBooking));
router.get('/:id', asyncHandler(getBooking));

router.patch(
  '/:id/status',
  authorize('provider', 'staff'),
  validate(updateStatusSchema),
  asyncHandler(updateBookingStatus),
);

router.post('/:id/cancel', validate(cancelSchema), asyncHandler(cancelBooking));

// Checkout (cash-on-delivery)
router.post('/:id/pay', authorize('customer'), validate(paySchema), asyncHandler(payBooking));

// OTP-based keyless pickup
router.post('/:id/access-otp', authorize('provider', 'staff'), asyncHandler(generateAccessOtp));
router.post(
  '/:id/redeem-otp',
  authorize('customer'),
  validate(accessOtpSchema),
  asyncHandler(redeemAccessOtp),
);

// OTP-based return hand-off
router.post('/:id/return-otp', authorize('provider', 'staff'), asyncHandler(generateReturnOtp));
router.post(
  '/:id/redeem-return-otp',
  authorize('customer'),
  validate(accessOtpSchema),
  asyncHandler(redeemReturnOtp),
);

// Post-rental review
router.post('/:id/review', authorize('customer'), validate(reviewSchema), asyncHandler(createReview));

export default router;
