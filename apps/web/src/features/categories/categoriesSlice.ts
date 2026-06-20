import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import type { Category } from '../../types';

interface CategoriesState {
  items: Category[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CategoriesState = { items: [], status: 'idle' };

export const fetchCategories = createAsyncThunk('categories/fetch', async (providerId?: string) => {
  const params = providerId ? { provider: providerId } : {};
  const { data } = await api.get('/categories', { params });
  return data.data as Category[];
});

export const createCategory = createAsyncThunk(
  'categories/create',
  async (body: Record<string, unknown>) => {
    const { data } = await api.post('/categories', body);
    return data.data as Category;
  },
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
    const { data } = await api.put(`/categories/${id}`, body);
    return data.data as Category;
  },
);

export const deleteCategory = createAsyncThunk('categories/delete', async (id: string) => {
  await api.delete(`/categories/${id}`);
  return id;
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload);
      });
  },
});

export default categoriesSlice.reducer;
