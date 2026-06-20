import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import { Payment } from '../models/Payment';
import { Vehicle } from '../models/Vehicle';
import { providerScope } from '../utils/scope';

export const revenueQuerySchema = z.object({
  query: z
    .object({
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      groupBy: z.enum(['day', 'month']).optional(),
    })
    .passthrough(),
});

function scopeId(req: Request): Types.ObjectId {
  return new Types.ObjectId(providerScope(req.user));
}

/** Headline KPIs for the dashboard. */
export async function reportSummary(req: Request, res: Response): Promise<void> {
  const providerId = scopeId(req);

  const [fleetSize, available, rented, totalBookings, activeBookings, revenueAgg] = await Promise.all([
    Vehicle.countDocuments({ providerId }),
    Vehicle.countDocuments({ providerId, status: 'available' }),
    Vehicle.countDocuments({ providerId, status: 'rented' }),
    Booking.countDocuments({ providerId }),
    Booking.countDocuments({ providerId, status: { $in: ['confirmed', 'preparing', 'ready', 'active'] } }),
    Payment.aggregate<{ total: number }>([
      { $match: { providerId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalRevenue = revenueAgg[0]?.total ?? 0;
  const utilizationRate = fleetSize > 0 ? Math.round((rented / fleetSize) * 100) : 0;

  res.json({
    success: true,
    data: { fleetSize, available, rented, totalBookings, activeBookings, totalRevenue, utilizationRate },
  });
}

/** Paid revenue time series, grouped by day (default) or month. */
export async function reportRevenue(req: Request, res: Response): Promise<void> {
  const providerId = scopeId(req);
  const groupBy = req.query.groupBy === 'month' ? 'month' : 'day';
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  const from = req.query.from
    ? new Date(String(req.query.from))
    : new Date(to.getTime() - 30 * 86_400_000);

  const format = groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
  const rows = await Payment.aggregate<{ _id: string; revenue: number; bookings: number }>([
    { $match: { providerId, status: 'paid', createdAt: { $gte: from, $lte: to } } },
    {
      $group: {
        _id: { $dateToString: { format, date: '$createdAt' } },
        revenue: { $sum: '$amount' },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: rows.map((r) => ({ period: r._id, revenue: r.revenue, bookings: r.bookings })),
    meta: { from, to, groupBy },
  });
}

/** Top vehicles by booking volume. */
export async function reportPopularVehicles(req: Request, res: Response): Promise<void> {
  const providerId = scopeId(req);
  const rows = await Booking.aggregate([
    { $match: { providerId } },
    { $group: { _id: '$vehicleId', bookings: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
    { $sort: { bookings: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'vehicles', localField: '_id', foreignField: '_id', as: 'vehicle' } },
    { $unwind: '$vehicle' },
    {
      $project: {
        _id: 0,
        vehicleId: '$_id',
        name: '$vehicle.name',
        bookings: 1,
        revenue: 1,
        rating: '$vehicle.rating',
      },
    },
  ]);
  res.json({ success: true, data: rows });
}

/** Customers who booked from this provider, with totals. */
export async function reportCustomers(req: Request, res: Response): Promise<void> {
  const providerId = scopeId(req);
  const rows = await Booking.aggregate([
    { $match: { providerId } },
    {
      $group: {
        _id: '$customerId',
        bookings: { $sum: 1 },
        totalSpent: { $sum: '$pricing.total' },
        lastBooking: { $max: '$createdAt' },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'customer' } },
    { $unwind: '$customer' },
    {
      $project: {
        _id: 0,
        customerId: '$_id',
        name: '$customer.name',
        email: '$customer.email',
        bookings: 1,
        totalSpent: 1,
        lastBooking: 1,
      },
    },
  ]);
  res.json({ success: true, data: rows });
}
