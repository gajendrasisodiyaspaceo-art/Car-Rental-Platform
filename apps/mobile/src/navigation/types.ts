import type { Vehicle } from '../types';
import type { VehicleFilters } from '../store/vehiclesSlice';

// Single param list covering EVERY route across all stacks/tabs so that
// existing screens using NativeStackScreenProps<RootStackParamList,'X'> compile.
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Home: undefined;
  CarList: { filter?: VehicleFilters; title?: string } | undefined;
  VehicleDetail: { vehicle: Vehicle };
  BookingConfig: { vehicle: Vehicle };
  Checkout: { bookingId: string };
  Bookings: undefined;
  BookingDetail: { bookingId: string };
  Review: { bookingId: string };
  VerifyOtp: undefined;
  Profile: undefined;
  Notifications: undefined;
  NearestLocation: undefined;
  Favorites: undefined;
};
