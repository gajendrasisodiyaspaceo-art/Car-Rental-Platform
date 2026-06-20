import { Request, Response } from 'express';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { ApiError } from '../utils/ApiError';
import { providerScope } from '../utils/scope';
import { PAYMENT_METHODS } from '../types';

export const paySchema = z.object({
  body: z.object({ method: z.enum(PAYMENT_METHODS) }).strict(),
});

/**
 * Customer confirms checkout for a booking. Only cash-on-delivery is supported
 * today (card gateway is a later phase); the charge is collected at pickup.
 */
export async function payBooking(req: Request, res: Response): Promise<void> {
  const { method } = req.body;
  if (method !== 'cash_on_delivery') {
    throw ApiError.badRequest('Only cash_on_delivery is supported at this time');
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== req.user!.id) throw ApiError.forbidden();
  if (['cancelled', 'rejected', 'completed'].includes(booking.status)) {
    throw ApiError.badRequest(`Cannot pay for a booking that is ${booking.status}`);
  }

  const existing = await Payment.findOne({ bookingId: booking.id });
  if (existing) {
    res.json({ success: true, data: existing });
    return;
  }

  const payment = await Payment.create({
    bookingId: booking.id,
    customerId: booking.customerId,
    providerId: booking.providerId,
    amount: booking.pricing.total,
    currency: booking.pricing.currency,
    method,
    status: 'pending',
  });

  res.status(201).json({ success: true, data: payment });
}

/** Customer sees own payments; provider/staff see payments across their fleet. */
export async function listPayments(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const filter =
    user.role === 'customer' ? { customerId: user.id } : { providerId: providerScope(user) };

  const items = await Payment.find(filter).populate('bookingId', 'status startDate endDate').sort('-createdAt');
  res.json({ success: true, data: items });
}
