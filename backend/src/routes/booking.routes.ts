import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createBooking,
  listBookings,
  getBooking,
  updateBookingStatus,
  generateAccessOtp,
  redeemAccessOtp,
  createBookingSchema,
  updateStatusSchema,
  accessOtpSchema,
} from '../controllers/booking.controller';

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

// OTP-based keyless access
router.post(
  '/:id/access-otp',
  authorize('provider', 'staff'),
  asyncHandler(generateAccessOtp),
);
router.post(
  '/:id/redeem-otp',
  authorize('customer'),
  validate(accessOtpSchema),
  asyncHandler(redeemAccessOtp),
);

export default router;
