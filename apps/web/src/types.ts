export type Role = 'customer' | 'provider' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface VehicleRating {
  average: number;
  count: number;
}

export type VehicleTransmission = 'automatic' | 'manual';
export type VehicleFuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';
export type VehicleStatus = 'available' | 'rented' | 'maintenance' | 'inactive';

export interface Vehicle {
  _id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  plateNumber?: string;
  seats?: number;
  transmission: VehicleTransmission | string;
  fuelType: VehicleFuelType | string;
  status: VehicleStatus | string;
  images: string[];
  features: string[];
  pricing: { daily: number; weekly?: number; monthly?: number };
  currency: string;
  categoryId?: { _id: string; name: string } | string;
  branchId?: { _id: string; name: string } | string;
  rentalTerms?: string;
  rating?: VehicleRating;
}

export interface VehicleFormData {
  name: string;
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  seats: string;
  categoryId: string;
  branchId: string;
  transmission: VehicleTransmission | '';
  fuelType: VehicleFuelType | '';
  dailyPrice: string;
  weeklyPrice: string;
  monthlyPrice: string;
  currency: string;
  status: VehicleStatus | '';
  features: string;
  images: string;
  rentalTerms: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  parent?: { _id: string; name: string } | string;
  isActive: boolean;
}

export interface Branch {
  _id: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  location?: { lat: number; lng: number };
  operatingHours?: string;
  isActive: boolean;
}

export interface BookingPricing {
  base: number;
  extras: number;
  discount: number;
  tax: number;
  lateFee: number;
  total: number;
  currency: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface BookingCustomer {
  _id: string;
  name: string;
  email: string;
}

export interface BookingVehicle {
  _id: string;
  name: string;
  images: string[];
  pricing: { daily: number; weekly?: number; monthly?: number };
}

export interface Booking {
  _id: string;
  status: BookingStatus;
  plan: string;
  startDate: string;
  endDate: string;
  pricing: BookingPricing;
  vehicleId?: BookingVehicle | string;
  userId?: BookingCustomer | string;
  notes?: string;
  cancellationReason?: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Payment {
  _id: string;
  bookingId: { _id: string; status: BookingStatus; startDate: string; endDate: string } | string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
}
