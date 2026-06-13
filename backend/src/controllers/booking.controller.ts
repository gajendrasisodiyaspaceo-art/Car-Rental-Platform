import { Request, Response } from 'express';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import { Vehicle } from '../models/Vehicle';
import { ApiError } from '../utils/ApiError';
import { providerScope } from '../utils/scope';
import { issueOtp, verifyOtp } from '../services/otp.service';
import { BOOKING_STATUSES, RENTAL_PLANS, RentalPlan } from '../types';

const TAX_RATE = 0.05;

export const createBookingSchema = z.object({
  body: z.object({
    vehicleId: z.string(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    plan: z.enum(RENTAL_PLANS).optional(),
    pickupBranchId: z.string().optional(),
    dropoffBranchId: z.string().optional(),
    extras: z.array(z.string()).optional(),
    discountCode: z.string().optional(),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({ status: z.enum(BOOKING_STATUSES) }),
});

export const accessOtpSchema = z.object({
  body: z.object({ code: z.string().length(6) }),
});

function rentalDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

function basePrice(
  plan: RentalPlan,
  days: number,
  pricing: { daily: number; weekly?: number; monthly?: number },
): number {
  switch (plan) {
    case 'monthly':
      return (pricing.monthly ?? pricing.daily * 30) * Math.max(1, Math.ceil(days / 30));
    case 'weekly':
      return (pricing.weekly ?? pricing.daily * 7) * Math.max(1, Math.ceil(days / 7));
    default:
      return pricing.daily * days;
  }
}

export async function createBooking(req: Request, res: Response): Promise<void> {
  const customerId = req.user!.id;
  const { vehicleId, startDate, endDate, plan = 'daily', extras = [] } = req.body;

  if (endDate <= startDate) throw ApiError.badRequest('endDate must be after startDate');

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (vehicle.status !== 'available') throw ApiError.badRequest('Vehicle is not available');

  const days = rentalDays(startDate, endDate);
  const base = basePrice(plan, days, vehicle.pricing);
  const tax = Math.round(base * TAX_RATE * 100) / 100;
  const total = base + tax;

  const booking = await Booking.create({
    customerId,
    providerId: vehicle.providerId,
    vehicleId,
    pickupBranchId: req.body.pickupBranchId,
    dropoffBranchId: req.body.dropoffBranchId,
    startDate,
    endDate,
    plan,
    extras,
    discountCode: req.body.discountCode,
    pricing: { base, extras: 0, tax, total, currency: vehicle.currency },
  });

  res.status(201).json({ success: true, data: booking });
}

export async function listBookings(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const filter: Record<string, unknown> =
    user.role === 'customer' ? { customerId: user.id } : { providerId: providerScope(user) };
  if (req.query.status) filter.status = req.query.status;

  const items = await Booking.find(filter)
    .populate('vehicleId', 'name images pricing')
    .sort('-createdAt');
  res.json({ success: true, data: items });
}

export async function getBooking(req: Request, res: Response): Promise<void> {
  const booking = await Booking.findById(req.params.id).populate('vehicleId');
  if (!booking) throw ApiError.notFound('Booking not found');

  const user = req.user!;
  const owns =
    user.role === 'customer'
      ? String(booking.customerId) === user.id
      : String(booking.providerId) === providerScope(user);
  if (!owns) throw ApiError.forbidden();

  res.json({ success: true, data: booking });
}

export async function updateBookingStatus(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, providerId },
    { status: req.body.status },
    { new: true },
  );
  if (!booking) throw ApiError.notFound('Booking not found');
  res.json({ success: true, data: booking });
}

/** Provider generates a one-time code for keyless lock-box access. */
export async function generateAccessOtp(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const booking = await Booking.findOne({ _id: req.params.id, providerId });
  if (!booking) throw ApiError.notFound('Booking not found');

  const code = await issueOtp({
    purpose: 'vehicle_access',
    bookingId: booking.id,
    userId: booking.customerId,
  });
  res.json({ success: true, data: { code } });
}

/** Customer redeems the lock-box code at pickup. */
export async function redeemAccessOtp(req: Request, res: Response): Promise<void> {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== req.user!.id) throw ApiError.forbidden();

  const ok = await verifyOtp(req.body.code, 'vehicle_access', { bookingId: booking.id });
  if (!ok) throw ApiError.badRequest('Invalid or expired access code');

  booking.status = 'active';
  await booking.save();
  res.json({ success: true, message: 'Vehicle unlocked', data: booking });
}
