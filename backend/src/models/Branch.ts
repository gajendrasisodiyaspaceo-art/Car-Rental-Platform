import { Schema, model, Document, Types } from 'mongoose';

export interface IBranch extends Document {
  providerId: Types.ObjectId;
  name: string;
  address: string;
  city?: string;
  country?: string;
  location?: { lat: number; lng: number };
  operatingHours?: string;
  isActive: boolean;
}

const branchSchema = new Schema<IBranch>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: String,
    country: String,
    location: { lat: Number, lng: Number },
    operatingHours: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Branch = model<IBranch>('Branch', branchSchema);
