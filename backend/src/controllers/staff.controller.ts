import { Request, Response } from 'express';
import { z } from 'zod';
import { User, USER_LIST_FIELDS } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { providerScope } from '../utils/scope';
import { USER_STATUSES } from '../types';

export const createStaffSchema = z.object({
  body: z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z
        .string()
        .min(8)
        .regex(/[a-zA-Z]/)
        .regex(/[0-9]/),
      phone: z.string().optional(),
    })
    .strict(),
});

export const updateStaffSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      phone: z.string().optional(),
      status: z.enum(USER_STATUSES).optional(),
    })
    .strict(),
});

/** Provider lists their own staff. */
export async function listStaff(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const items = await User.find({ providerId, role: 'staff' })
    .select(USER_LIST_FIELDS)
    .sort('-createdAt');
  res.json({ success: true, data: items });
}

/** Provider creates a staff account scoped to themselves. */
export async function createStaff(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const exists = await User.findOne({ email: req.body.email });
  if (exists) throw ApiError.badRequest('Email already registered');

  const staff = await User.create({
    ...req.body,
    role: 'staff',
    providerId,
    isVerified: true,
  });
  res.status(201).json({
    success: true,
    data: { id: staff.id, name: staff.name, email: staff.email, role: staff.role, status: staff.status },
  });
}

export async function updateStaff(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const staff = await User.findOneAndUpdate(
    { _id: req.params.id, providerId, role: 'staff' },
    { $set: req.body },
    { new: true },
  ).select(USER_LIST_FIELDS);
  if (!staff) throw ApiError.notFound('Staff member not found');
  res.json({ success: true, data: staff });
}

export async function deleteStaff(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const result = await User.findOneAndDelete({ _id: req.params.id, providerId, role: 'staff' });
  if (!result) throw ApiError.notFound('Staff member not found');
  res.json({ success: true, message: 'Staff member removed' });
}
