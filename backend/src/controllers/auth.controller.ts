import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { issueOtp, verifyOtp } from '../services/otp.service';

// Public self-registration may only create end users or providers — never
// staff/admin (those are provisioned internally) to prevent privilege escalation.
const SELF_SIGNUP_ROLES = ['customer', 'provider'] as const;

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().optional(),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128)
        .regex(/[a-zA-Z]/, 'Password must contain a letter')
        .regex(/[0-9]/, 'Password must contain a number'),
      role: z.enum(SELF_SIGNUP_ROLES).optional(),
    })
    .strict(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().email(),
      password: z.string().min(1),
    })
    .strict(),
});

export const verifyOtpSchema = z.object({
  body: z
    .object({
      userId: z.string(),
      code: z.string().length(6),
    })
    .strict(),
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
  await issueOtp({ purpose: 'verification', userId: user.id });

  res.status(201).json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: tokenFor(user),
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid credentials');
  }
  if (user.status === 'suspended') {
    throw ApiError.forbidden('Account suspended — contact support');
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

export const updateMeSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      phone: z.string().max(30).optional(),
      drivingLicense: z
        .object({ number: z.string().min(1), expiry: z.coerce.date().optional() })
        .strict()
        .optional(),
      addresses: z
        .array(
          z
            .object({
              label: z.string().optional(),
              line1: z.string().min(1),
              city: z.string().optional(),
              country: z.string().optional(),
              isDefault: z.boolean().optional(),
            })
            .strict(),
        )
        .optional(),
    })
    .strict(),
});

export async function updateMe(req: Request, res: Response): Promise<void> {
  const user = await User.findByIdAndUpdate(req.user!.id, { $set: req.body }, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, data: user });
}
