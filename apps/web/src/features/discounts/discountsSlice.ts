import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import type { Discount } from '../../types';

interface DiscountsState {
  items: Discount[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: DiscountsState = { items: [], status: 'idle' };

export const fetchDiscounts = createAsyncThunk('discounts/fetch', async () => {
  const { data } = await api.get('/discounts');
  return data.data as Discount[];
});

export const createDiscount = createAsyncThunk(
  'discounts/create',
  async (body: Record<string, unknown>) => {
    const { data } = await api.post('/discounts', body);
    return data.data as Discount;
  },
);

export const updateDiscount = createAsyncThunk(
  'discounts/update',
  async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
    const { data } = await api.put(`/discounts/${id}`, body);
    return data.data as Discount;
  },
);

export const deleteDiscount = createAsyncThunk('discounts/delete', async (id: string) => {
  await api.delete(`/discounts/${id}`);
  return id;
});

const discountsSlice = createSlice({
  name: 'discounts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscounts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDiscounts.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchDiscounts.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(createDiscount.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateDiscount.fulfilled, (state, action) => {
        const idx = state.items.findIndex((d) => d._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteDiscount.fulfilled, (state, action) => {
        state.items = state.items.filter((d) => d._id !== action.payload);
      });
  },
});

export default discountsSlice.reducer;
