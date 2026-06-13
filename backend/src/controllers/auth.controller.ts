import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { issueOtp, verifyOtp } from '../services/otp.service';
import { ROLES } from '../types';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(6),
    role: z.enum(ROLES).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    userId: z.string(),
    code: z.string().length(6),
  }),
});

function tokenFor(user: { id?: unknown; role: unknown; providerId?: unknown }) {
  return signToken({
    sub: String(user.id),
    role: user.role as never,
    providerId: user.providerId ? String(user.providerId) : undefined,
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, phone, password, role } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.badRequest('Email already registered');

  const user = await User.create({ name, email, phone, password, role: role ?? 'customer' });
  const code = await issueOtp({ purpose: 'verification', userId: user.id });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: tokenFor(user),
      // dev convenience — remove once OTP delivery is wired up
      devOtp: code,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: tokenFor(user),
    },
  });
}

export async function confirmOtp(req: Request, res: Response): Promise<void> {
  const { userId, code } = req.body;
  const ok = await verifyOtp(code, 'verification', { userId });
  if (!ok) throw ApiError.badRequest('Invalid or expired code');
  await User.findByIdAndUpdate(userId, { isVerified: true });
  res.json({ success: true, message: 'Account verified' });
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id);
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, data: user });
}
