import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/client';
import type { Vehicle } from '../types';

export interface VehicleFilters {
  q?: string;
  categoryId?: string;
  transmission?: string;
  fuelType?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  page?: number;
  limit?: number;
}

interface VehiclesState {
  items: Vehicle[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: VehiclesState = { items: [], status: 'idle' };

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetch',
  async (filters: VehicleFilters | void) => {
    const f: VehicleFilters = filters ?? {};
    const params: Record<string, string | number> = {};
    if (f.q) params.q = f.q;
    if (f.categoryId) params.categoryId = f.categoryId;
    if (f.transmission) params.transmission = f.transmission;
    if (f.fuelType) params.fuelType = f.fuelType;
    if (f.minPrice != null) params.minPrice = f.minPrice;
    if (f.maxPrice != null) params.maxPrice = f.maxPrice;
    if (f.status) params.status = f.status;
    if (f.page != null) params.page = f.page;
    if (f.limit != null) params.limit = f.limit;
    const { data } = await api.get('/vehicles', { params });
    return data.data as Vehicle[];
  },
);

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default vehiclesSlice.reducer;
