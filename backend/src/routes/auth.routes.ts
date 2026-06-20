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
  updateMe,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  updateMeSchema,
} from '../controllers/auth.controller';

const router = Router();

const WINDOW_MS = 15 * 60 * 1000;

// Brute-force protection on unauthenticated, credential-sensitive endpoints.
// Login and OTP verify also key on the target account so an attacker rotating
// IPs can't get unlimited guesses against one victim.
const ipLimiter = rateLimit({ windowMs: WINDOW_MS, max: 10 });
const loginLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  keyGenerator: (req) => `login:${req.ip}:${String((req.body as { email?: string })?.email ?? '')}`,
});
const otpLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: 10,
  keyGenerator: (req) => `otp:${req.ip}:${String((req.body as { userId?: string })?.userId ?? '')}`,
});

router.post('/register', ipLimiter, validate(registerSchema), asyncHandler(register));
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));
router.post('/verify-otp', otpLimiter, validate(verifyOtpSchema), asyncHandler(confirmOtp));
router.get('/me', authenticate, asyncHandler(me));
router.put('/me', authenticate, validate(updateMeSchema), asyncHandler(updateMe));

export default router;
