import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  register,
  login,
  confirmOtp,
  me,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
} from '../controllers/auth.controller';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.post('/verify-otp', validate(verifyOtpSchema), asyncHandler(confirmOtp));
router.get('/me', authenticate, asyncHandler(me));

export default router;
