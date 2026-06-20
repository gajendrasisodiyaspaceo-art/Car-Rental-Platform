import { Schema, model, Document, Types } from 'mongoose';
import { OTP_PURPOSES, OtpPurpose } from '../types';

export interface IOtp extends Document {
  code: string;
  purpose: OtpPurpose;
  userId?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  destination?: string;
  consumed: boolean;
  attempts: number;
  expiresAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    code: { type: String, required: true },
    purpose: { type: String, enum: OTP_PURPOSES, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true },
    destination: String,
    consumed: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index: documents auto-removed once expired.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Otp = model<IOtp>('Otp', otpSchema);
