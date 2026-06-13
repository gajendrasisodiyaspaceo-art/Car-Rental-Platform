import { Schema, model, Document, Types } from 'mongoose';

export interface IVehicleCategory extends Document {
  providerId: Types.ObjectId;
  name: string;
  description?: string;
  parent?: Types.ObjectId;
  isActive: boolean;
}

const vehicleCategorySchema = new Schema<IVehicleCategory>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: String,
    parent: { type: Schema.Types.ObjectId, ref: 'VehicleCategory' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const VehicleCategory = model<IVehicleCategory>('VehicleCategory', vehicleCategorySchema);
