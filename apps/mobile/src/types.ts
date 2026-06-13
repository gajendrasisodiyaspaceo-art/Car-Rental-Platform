export type Role = 'customer' | 'provider' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
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
}

export interface Booking {
  _id: string;
  status: string;
  plan: string;
  startDate: string;
  endDate: string;
  pricing: { total: number; currency: string };
  vehicleId?: Pick<Vehicle, '_id' | 'name' | 'images' | 'pricing'> | string;
}
