import type { Vehicle, Booking } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Home: undefined;
  VehicleDetail: { vehicle: Vehicle };
  BookingConfig: { vehicle: Vehicle };
  Checkout: { bookingId: string };
  Bookings: undefined;
  BookingDetail: { bookingId: string };
  Review: { bookingId: string };
  VerifyOtp: undefined;
};
