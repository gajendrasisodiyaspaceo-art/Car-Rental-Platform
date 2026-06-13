import { Schema, model, Types } from 'mongoose';
import {
  FUEL_TYPES,
  FuelType,
  TRANSMISSIONS,
  Transmission,
  VEHICLE_STATUSES,
  VehicleStatus,
} from '../types';

interface Pricing {
  daily: number;
  weekly?: number;
  monthly?: number;
}

// Not extending Document: the `model` field below would clash with Mongoose's
// Document.model. model<IVehicle>() still hydrates _id/id/save() on results.
export interface IVehicle {
  providerId: Types.ObjectId;
  categoryId: Types.ObjectId;
  branchId?: Types.ObjectId;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  plateNumber?: string;
  seats?: number;
  transmission: Transmission;
  fuelType: FuelType;
  images: string[];
  features: string[];
  pricing: Pricing;
  currency: string;
  status: VehicleStatus;
  rentalTerms?: string;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'VehicleCategory', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    name: { type: String, required: true, trim: true },
    make: String,
    model: String,
    year: Number,
    plateNumber: { type: String, trim: true },
    seats: Number,
    transmission: { type: String, enum: TRANSMISSIONS, default: 'automatic' },
    fuelType: { type: String, enum: FUEL_TYPES, default: 'petrol' },
    images: { type: [String], default: [] },
    features: { type: [String], default: [] },
    pricing: {
      daily: { type: Number, required: true },
      weekly: Number,
      monthly: Number,
    },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: VEHICLE_STATUSES, default: 'available', index: true },
    rentalTerms: String,
  },
  { timestamps: true },
);

vehicleSchema.index({ name: 'text', make: 'text', model: 'text' });

export const Vehicle = model<IVehicle>('Vehicle', vehicleSchema);
