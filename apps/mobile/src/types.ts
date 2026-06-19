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

export interface Vehicle {
  _id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  seats?: number;
  transmission: string;
  fuelType: string;
  status: string;
  images: string[];
  features: string[];
  pricing: { daily: number; weekly?: number; monthly?: number };
  currency: string;
  rating?: VehicleRating;
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

export interface Booking {
  _id: string;
  status: string;
  plan: string;
  startDate: string;
  endDate: string;
  pricing: BookingPricing;
  extras?: string[];
  discountCode?: string;
  vehicleId?: Pick<Vehicle, '_id' | 'name' | 'images' | 'pricing'> | string;
}

export interface Payment {
  _id: string;
  bookingId: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  bookingId: string;
  vehicleId: string;
  rating: number;
  comment?: string;
  customerId: { name: string } | string;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  parent?: string;
  isActive: boolean;
}
