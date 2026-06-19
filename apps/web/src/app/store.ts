import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import vehiclesReducer from '../features/vehicles/vehiclesSlice';
import bookingsReducer from '../features/bookings/bookingsSlice';
import categoriesReducer from '../features/categories/categoriesSlice';
import branchesReducer from '../features/branches/branchesSlice';
import discountsReducer from '../features/discounts/discountsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehiclesReducer,
    bookings: bookingsReducer,
    categories: categoriesReducer,
    branches: branchesReducer,
    discounts: discountsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
