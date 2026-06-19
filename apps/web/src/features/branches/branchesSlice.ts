import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import type { Branch } from '../../types';

interface BranchesState {
  items: Branch[];
  status: 'idle' | 'loading' | 'failed';
}

const initialState: BranchesState = { items: [], status: 'idle' };

export const fetchBranches = createAsyncThunk('branches/fetch', async () => {
  const { data } = await api.get('/branches');
  return data.data as Branch[];
});

export const createBranch = createAsyncThunk(
  'branches/create',
  async (body: Record<string, unknown>) => {
    const { data } = await api.post('/branches', body);
    return data.data as Branch;
  },
);

export const updateBranch = createAsyncThunk(
  'branches/update',
  async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
    const { data } = await api.put(`/branches/${id}`, body);
    return data.data as Branch;
  },
);

export const deleteBranch = createAsyncThunk('branches/delete', async (id: string) => {
  await api.delete(`/branches/${id}`);
  return id;
});

const branchesSlice = createSlice({
  name: 'branches',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload;
      })
      .addCase(fetchBranches.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        const idx = state.items.findIndex((b) => b._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b._id !== action.payload);
      });
  },
});

export default branchesSlice.reducer;
