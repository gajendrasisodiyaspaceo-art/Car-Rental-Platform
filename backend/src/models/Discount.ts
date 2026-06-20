import { Schema, model, Document, Types } from 'mongoose';
import { DISCOUNT_TYPES, DiscountType } from '../types';

export interface IDiscount extends Document {
  providerId: Types.ObjectId;
  code: string;
  type: DiscountType;
  value: number;
  isActive: boolean;
  expiresAt?: Date;
  maxRedemptions?: number;
  timesRedeemed: number;
}

const discountSchema = new Schema<IDiscount>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, enum: DISCOUNT_TYPES, required: true },
    // percent: 0-100; flat: absolute amount off the base price
    value: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    expiresAt: Date,
    maxRedemptions: Number,
    timesRedeemed: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// One code per provider.
discountSchema.index({ providerId: 1, code: 1 }, { unique: true });

export const Discount = model<IDiscount>('Discount', discountSchema);
