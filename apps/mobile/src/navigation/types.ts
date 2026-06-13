import type { Vehicle } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  VehicleDetail: { vehicle: Vehicle };
  Bookings: undefined;
};
