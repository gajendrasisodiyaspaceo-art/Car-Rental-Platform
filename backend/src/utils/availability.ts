import { Booking } from '../models/Booking';
import { BookingStatus } from '../types';

// Statuses that hold a vehicle for a date range (i.e. block overlapping bookings).
const BLOCKING_STATUSES: BookingStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'active',
];

/**
 * True when another live booking for `vehicleId` overlaps [start, end).
 * Two ranges overlap when each starts before the other ends.
 */
export async function hasBookingConflict(
  vehicleId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const conflict = await Booking.findOne({
    vehicleId,
    status: { $in: BLOCKING_STATUSES },
    startDate: { $lt: end },
    endDate: { $gt: start },
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {}),
  }).select('_id');

  return Boolean(conflict);
}
