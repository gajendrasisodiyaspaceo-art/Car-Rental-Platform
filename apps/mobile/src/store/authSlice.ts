import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api, saveToken, loadToken } from '../api/client';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: AuthState = { user: null, token: null, status: 'idle', error: null };

export const restoreSession = createAsyncThunk('auth/restore', async () => {
  const token = await loadToken();
  return token;
});

export const login = createAsyncThunk(
  'auth/login',
  async (creds: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', creds);
    await saveToken(data.data.token);
    return data.data as { user: User; token: string };
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { name: string; email: string; password: string; phone?: string }) => {
    const { data } = await api.post('/auth/register', payload);
    await saveToken(data.data.token);
    return data.data as { user: User; token: string };
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      void saveToken(null);
      state.user = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    const onAuth = (state: AuthState, action: PayloadAction<{ user: User; token: string }>) => {
      state.status = 'idle';
      state.user = action.payload.user;
      state.token = action.payload.token;
    };
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.token = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, onAuth)
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Login failed';
      })
      .addCase(register.fulfilled, onAuth);
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
