import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/client';
import type { Vehicle } from '../types';

interface VehiclesState {
  items: Vehicle[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: VehiclesState = { items: [], status: 'idle' };

export const fetchVehicles = createAsyncThunk('vehicles/fetch', async () => {
  const { data } = await api.get('/vehicles');
  return data.data as Vehicle[];
});

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
