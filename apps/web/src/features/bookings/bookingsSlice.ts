import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import type { Booking } from '../../types';

interface BookingsState {
  items: Booking[];
  selected: Booking | null;
  status: 'idle' | 'loading' | 'failed';
  selectedStatus: 'idle' | 'loading' | 'failed';
}

const initialState: BookingsState = {
  items: [],
  selected: null,
  status: 'idle',
  selectedStatus: 'idle',
};

export const fetchBookings = createAsyncThunk('bookings/fetch', async () => {
  const { data } = await api.get('/bookings');
  return data.data as Booking[];
});

export const fetchBookingById = createAsyncThunk('bookings/fetchById', async (id: string) => {
  const { data } = await api.get(`/bookings/${id}`);
  return data.data as Booking;
});

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
      state.selectedStatus = 'idle';
    },
    updateSelected(state, action: { payload: Booking }) {
      state.selected = action.payload;
      const idx = state.items.findIndex((b) => b._id === action.payload._id);
      if (idx !== -1) state.items[idx] = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchBookings.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(fetchBookingById.pending, (state) => {
        state.selectedStatus = 'loading';
        state.selected = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.selectedStatus = 'idle';
        state.selected = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state) => {
        state.selectedStatus = 'failed';
      });
  },
});

export const { clearSelected, updateSelected } = bookingsSlice.actions;
export default bookingsSlice.reducer;
