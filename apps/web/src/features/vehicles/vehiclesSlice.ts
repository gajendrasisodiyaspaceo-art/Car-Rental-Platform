import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import type { Vehicle } from '../../types';

interface VehiclesState {
  items: Vehicle[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: VehiclesState = { items: [], status: 'idle' };

export const fetchVehicles = createAsyncThunk('vehicles/fetch', async (providerId?: string) => {
  const params = providerId ? { provider: providerId } : {};
  const { data } = await api.get('/vehicles', { params });
  return data.data as Vehicle[];
});

export const createVehicle = createAsyncThunk('vehicles/create', async (body: Record<string, unknown>) => {
  const { data } = await api.post('/vehicles', body);
  return data.data as Vehicle;
});

export const updateVehicle = createAsyncThunk(
  'vehicles/update',
  async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
    const { data } = await api.put(`/vehicles/${id}`, body);
    return data.data as Vehicle;
  },
);

export const deleteVehicle = createAsyncThunk('vehicles/delete', async (id: string) => {
  await api.delete(`/vehicles/${id}`);
  return id;
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
      })
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const idx = state.items.findIndex((v) => v._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.items = state.items.filter((v) => v._id !== action.payload);
      });
  },
});

export default vehiclesSlice.reducer;
