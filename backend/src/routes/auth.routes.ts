import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { rateLimit } from '../middleware/rateLimit';
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

// Brute-force protection on unauthenticated, credential-sensitive endpoints.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(login));
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), asyncHandler(confirmOtp));
router.get('/me', authenticate, asyncHandler(me));

export default router;
