import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../api/client';
import type { Category } from '../types';

interface CategoriesState {
  items: Category[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CategoriesState = { items: [], status: 'idle' };

export const fetchCategories = createAsyncThunk('categories/fetch', async () => {
  const { data } = await api.get('/categories');
  return data.data as Category[];
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
      });
  },
});

export default categoriesSlice.reducer;
