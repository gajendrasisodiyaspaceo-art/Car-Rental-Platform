import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, Role } from '../types';

interface Address {
  label?: string;
  line1: string;
  city?: string;
  country?: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
  /** Service provider this user belongs to (staff) or owns (provider). */
  providerId?: Types.ObjectId;
  isVerified: boolean;
  drivingLicense?: { number: string; expiry?: Date };
  addresses: Address[];
  loyaltyPoints: number;
  comparePassword(candidate: string): Promise<boolean>;
}

const addressSchema = new Schema<Address>(
  {
    label: String,
    line1: { type: String, required: true },
    city: String,
    country: String,
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    isVerified: { type: Boolean, default: false },
    drivingLicense: { number: String, expiry: Date },
    addresses: { type: [addressSchema], default: [] },
    loyaltyPoints: { type: Number, default: 0 },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', userSchema);
