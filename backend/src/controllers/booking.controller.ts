import { Request, Response } from 'express';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import { Vehicle } from '../models/Vehicle';
import { Payment } from '../models/Payment';
import { Discount } from '../models/Discount';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { providerScope } from '../utils/scope';
import { issueOtp, verifyOtp } from '../services/otp.service';
import { notify } from '../services/notification.service';
import { computePrice, rentalDays, DiscountSpec } from '../utils/pricing';
import { hasBookingConflict } from '../utils/availability';
import { BOOKING_STATUSES, RENTAL_PLANS, BookingStatus } from '../types';

// 1 loyalty point per 10 currency units of completed booking value.
const LOYALTY_PER_UNIT = 1 / 10;

/** Resolves a usable discount for a provider+code, or null if invalid/expired/exhausted. */
async function resolveDiscount(providerId: unknown, code?: string) {
  if (!code) return null;
  const discount = await Discount.findOne({
    providerId,
    code: code.toUpperCase(),
    isActive: true,
  });
  if (!discount) return null;
  if (discount.expiresAt && discount.expiresAt <= new Date()) return null;
  if (discount.maxRedemptions && discount.timesRedeemed >= discount.maxRedemptions) return null;
  return discount;
}

export const createBookingSchema = z.object({
  body: z
    .object({
      vehicleId: z.string(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      plan: z.enum(RENTAL_PLANS).optional(),
      pickupBranchId: z.string().optional(),
      dropoffBranchId: z.string().optional(),
      extras: z.array(z.string()).optional(),
      discountCode: z.string().optional(),
    })
    .strict(),
});

export const updateStatusSchema = z.object({
  body: z.object({ status: z.enum(BOOKING_STATUSES) }).strict(),
});

export const accessOtpSchema = z.object({
  body: z.object({ code: z.string().length(6) }).strict(),
});

export const cancelSchema = z.object({
  body: z.object({ reason: z.string().max(280).optional() }).strict(),
});

// Statuses from which a customer/provider may still cancel.
const CANCELLABLE: BookingStatus[] = ['pending', 'confirmed', 'preparing', 'ready'];

export async function createBooking(req: Request, res: Response): Promise<void> {
  const customerId = req.user!.id;
  const { vehicleId, startDate, endDate, plan = 'daily', extras = [], discountCode } = req.body;

  if (endDate <= startDate) throw ApiError.badRequest('endDate must be after startDate');

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  if (vehicle.status !== 'available') throw ApiError.badRequest('Vehicle is not available');

  if (await hasBookingConflict(vehicleId, startDate, endDate)) {
    throw ApiError.badRequest('Vehicle is already booked for the selected dates');
  }

  const discountDoc = await resolveDiscount(vehicle.providerId, discountCode);
  const discountSpec: DiscountSpec | undefined = discountDoc
    ? { type: discountDoc.type, value: discountDoc.value }
    : undefined;

  const pricing = computePrice({
    plan,
    start: startDate,
    end: endDate,
    pricing: vehicle.pricing,
    extras,
    discount: discountSpec,
  });

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
    discountCode: discountDoc ? discountDoc.code : undefined,
    pricing: { ...pricing, currency: vehicle.currency },
  });

  if (discountDoc) {
    discountDoc.timesRedeemed += 1;
    await discountDoc.save();
  }

  await notify(vehicle.providerId, {
    type: 'booking',
    title: 'New booking request',
    body: `${vehicle.name} · ${pricing.total} ${vehicle.currency}`,
    bookingId: booking.id,
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

  if (!ownsBooking(req, booking)) throw ApiError.forbidden();
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

  await notify(booking.customerId, {
    type: 'booking',
    title: `Booking ${booking.status}`,
    body: `Your booking is now ${booking.status}.`,
    bookingId: booking.id,
  });

  res.json({ success: true, data: booking });
}

/** Customer or owning provider cancels; a paid (COD) charge is marked refunded. */
export async function cancelBooking(req: Request, res: Response): Promise<void> {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (!ownsBooking(req, booking)) throw ApiError.forbidden();

  if (!CANCELLABLE.includes(booking.status)) {
    throw ApiError.badRequest(`Cannot cancel a booking that is ${booking.status}`);
  }

  booking.status = 'cancelled';
  if (req.body.reason) booking.notes = req.body.reason;
  await booking.save();

  await Payment.updateMany({ bookingId: booking.id, status: 'paid' }, { status: 'refunded' });

  res.json({ success: true, message: 'Booking cancelled', data: booking });
}

/** Provider generates a one-time code for keyless lock-box access at pickup. */
export async function generateAccessOtp(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const booking = await Booking.findOne({ _id: req.params.id, providerId });
  if (!booking) throw ApiError.notFound('Booking not found');

  const code = await issueOtp({
    purpose: 'vehicle_access',
    bookingId: booking.id,
    userId: booking.customerId,
  });
  await notify(booking.customerId, {
    type: 'otp',
    title: 'Vehicle ready for pickup',
    body: 'Your pickup code is ready — collect it from the provider.',
    bookingId: booking.id,
  });
  res.json({ success: true, data: { code } });
}

/** Customer redeems the lock-box code at pickup; COD payment is collected here. */
export async function redeemAccessOtp(req: Request, res: Response): Promise<void> {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== req.user!.id) throw ApiError.forbidden();

  const ok = await verifyOtp(req.body.code, 'vehicle_access', { bookingId: booking.id });
  if (!ok) throw ApiError.badRequest('Invalid or expired access code');

  booking.status = 'active';
  await booking.save();

  // Cash-on-delivery is handed over at pickup → mark the pending charge paid.
  await Payment.updateMany(
    { bookingId: booking.id, method: 'cash_on_delivery', status: 'pending' },
    { status: 'paid' },
  );

  res.json({ success: true, message: 'Vehicle unlocked', data: booking });
}

/** Provider generates the return hand-off code at the branch. */
export async function generateReturnOtp(req: Request, res: Response): Promise<void> {
  const providerId = providerScope(req.user);
  const booking = await Booking.findOne({ _id: req.params.id, providerId });
  if (!booking) throw ApiError.notFound('Booking not found');
  if (booking.status !== 'active') throw ApiError.badRequest('Booking is not active');

  const code = await issueOtp({
    purpose: 'vehicle_return',
    bookingId: booking.id,
    userId: booking.customerId,
  });
  res.json({ success: true, data: { code } });
}

/** Customer redeems the return code; booking completes and any late fee is applied. */
export async function redeemReturnOtp(req: Request, res: Response): Promise<void> {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== req.user!.id) throw ApiError.forbidden();
  if (booking.status !== 'active') throw ApiError.badRequest('Booking is not active');

  const ok = await verifyOtp(req.body.code, 'vehicle_return', { bookingId: booking.id });
  if (!ok) throw ApiError.badRequest('Invalid or expired return code');

  const now = new Date();
  if (now > booking.endDate) {
    const vehicle = await Vehicle.findById(booking.vehicleId).select('pricing');
    const lateDays = rentalDays(booking.endDate, now);
    const lateFee = Math.round((vehicle?.pricing.daily ?? 0) * lateDays * 100) / 100;
    booking.pricing.lateFee = lateFee;
    booking.pricing.total = Math.round((booking.pricing.total + lateFee) * 100) / 100;
  }

  booking.status = 'completed';
  booking.returnedAt = now;
  await booking.save();

  const earned = Math.floor(booking.pricing.total * LOYALTY_PER_UNIT);
  if (earned > 0) {
    await User.findByIdAndUpdate(booking.customerId, { $inc: { loyaltyPoints: earned } });
  }
  await notify(booking.customerId, {
    type: 'booking',
    title: 'Booking completed',
    body: earned > 0 ? `Thanks for returning! You earned ${earned} loyalty points.` : 'Thanks for returning!',
    bookingId: booking.id,
  });

  res.json({ success: true, message: 'Vehicle returned', data: booking });
}

function ownsBooking(req: Request, booking: { customerId: unknown; providerId: unknown }): boolean {
  const user = req.user!;
  return user.role === 'customer'
    ? String(booking.customerId) === user.id
    : String(booking.providerId) === providerScope(user);
}
