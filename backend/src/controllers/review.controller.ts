import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';
import { Vehicle } from '../models/Vehicle';
import { ApiError } from '../utils/ApiError';

export const reviewSchema = z.object({
  body: z
    .object({
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).optional(),
    })
    .strict(),
});

/** Customer reviews a completed booking (once); the vehicle rating is recomputed. */
export async function createReview(req: Request, res: Response): Promise<void> {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found');
  if (String(booking.customerId) !== req.user!.id) throw ApiError.forbidden();
  if (booking.status !== 'completed') {
    throw ApiError.badRequest('Only completed bookings can be reviewed');
  }
  if (await Review.exists({ bookingId: booking.id })) {
    throw ApiError.badRequest('Booking already reviewed');
  }

  const review = await Review.create({
    bookingId: booking.id,
    customerId: booking.customerId,
    vehicleId: booking.vehicleId,
    providerId: booking.providerId,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  await recomputeVehicleRating(String(booking.vehicleId));

  res.status(201).json({ success: true, data: review });
}

/** Public list of reviews for a vehicle. */
export async function listVehicleReviews(req: Request, res: Response): Promise<void> {
  const items = await Review.find({ vehicleId: req.params.id })
    .populate('customerId', 'name')
    .sort('-createdAt');
  res.json({ success: true, data: items });
}

async function recomputeVehicleRating(vehicleId: string): Promise<void> {
  const [agg] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { vehicleId: new Types.ObjectId(vehicleId) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  await Vehicle.findByIdAndUpdate(vehicleId, {
    rating: {
      average: agg ? Math.round(agg.average * 10) / 10 : 0,
      count: agg ? agg.count : 0,
    },
  });
}
