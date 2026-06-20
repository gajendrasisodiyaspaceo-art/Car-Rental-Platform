import { Request, Response } from 'express';
import { z } from 'zod';
import { User, USER_LIST_FIELDS } from '../models/User';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { ApiError } from '../utils/ApiError';
import { ROLES, USER_STATUSES } from '../types';

export const updateUserSchema = z.object({
  body: z
    .object({
      status: z.enum(USER_STATUSES).optional(),
      approved: z.boolean().optional(),
      role: z.enum(ROLES).optional(),
      isVerified: z.boolean().optional(),
    })
    .strict(),
});

/** Platform-wide list of users (admin), filterable by role/status. */
export async function listUsers(req: Request, res: Response): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  const items = await User.find(filter).select(USER_LIST_FIELDS).sort('-createdAt').limit(500);
  res.json({ success: true, data: items });
}

/** Providers with their approval/status (admin). */
export async function listProviders(_req: Request, res: Response): Promise<void> {
  const items = await User.find({ role: 'provider' }).select(USER_LIST_FIELDS).sort('-createdAt');
  res.json({ success: true, data: items });
}

/** Admin updates a user's status/approval/role. */
export async function adminUpdateUser(req: Request, res: Response): Promise<void> {
  if (req.params.id === req.user!.id) {
    throw ApiError.badRequest('Admins cannot modify their own account here');
  }
  const user = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).select(
    USER_LIST_FIELDS,
  );
  if (!user) throw ApiError.notFound('User not found');
  res.json({ success: true, data: user });
}

/** Platform-wide KPIs (admin). */
export async function platformStats(_req: Request, res: Response): Promise<void> {
  const [providers, customers, staff, bookings, revenueAgg] = await Promise.all([
    User.countDocuments({ role: 'provider' }),
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'staff' }),
    Booking.countDocuments({}),
    Payment.aggregate<{ total: number }>([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  res.json({
    success: true,
    data: {
      providers,
      customers,
      staff,
      bookings,
      platformRevenue: revenueAgg[0]?.total ?? 0,
    },
  });
}
