export const ROLES = ['customer', 'provider', 'staff', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const RENTAL_PLANS = ['daily', 'weekly', 'monthly', 'long_term'] as const;
export type RentalPlan = (typeof RENTAL_PLANS)[number];

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'active',
  'completed',
  'cancelled',
  'rejected',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const VEHICLE_STATUSES = ['available', 'rented', 'maintenance', 'inactive'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const TRANSMISSIONS = ['automatic', 'manual'] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid'] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const PAYMENT_METHODS = ['card', 'cash_on_delivery'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const OTP_PURPOSES = ['verification', 'vehicle_access', 'vehicle_return'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

export const DISCOUNT_TYPES = ['percent', 'flat'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const NOTIFICATION_TYPES = ['booking', 'payment', 'otp', 'promo', 'system'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const USER_STATUSES = ['active', 'suspended'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
