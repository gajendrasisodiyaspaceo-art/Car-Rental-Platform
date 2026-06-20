import { Schema, model, Document, Types } from 'mongoose';
import { BOOKING_STATUSES, BookingStatus, RENTAL_PLANS, RentalPlan } from '../types';

export interface IBooking extends Document {
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  pickupBranchId?: Types.ObjectId;
  dropoffBranchId?: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  plan: RentalPlan;
  status: BookingStatus;
  pricing: {
    base: number;
    extras: number;
    discount: number;
    tax: number;
    lateFee: number;
    total: number;
    currency: string;
  };
  extras: string[];
  discountCode?: string;
  notes?: string;
  returnedAt?: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    pickupBranchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    dropoffBranchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    plan: { type: String, enum: RENTAL_PLANS, default: 'daily' },
    status: { type: String, enum: BOOKING_STATUSES, default: 'pending', index: true },
    pricing: {
      base: { type: Number, required: true },
      extras: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      lateFee: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
    },
    extras: { type: [String], default: [] },
    discountCode: String,
    notes: String,
    returnedAt: Date,
  },
  { timestamps: true },
);

export const Booking = model<IBooking>('Booking', bookingSchema);
