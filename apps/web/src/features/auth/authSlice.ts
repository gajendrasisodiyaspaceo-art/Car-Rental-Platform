import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api, setToken, getToken } from '../../lib/api';
import type { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: getToken(),
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (creds: { email: string; password: string }) => {
    const { data } = await api.post('/auth/login', creds);
    setToken(data.data.token);
    return data.data as { user: User; token: string };
  },
);

export const fetchMe = createAsyncThunk('auth/me', async () => {
  const { data } = await api.get('/auth/me');
  return data.data as User;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      setToken(null);
      state.user = null;
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ user: User; token: string }>) => {
        state.status = 'idle';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Login failed';
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMe.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = 'idle';
        state.user = action.payload;
      })
      .addCase(fetchMe.rejected, (state) => {
        // Stale/invalid token — clear it so protected routes redirect to /login.
        setToken(null);
        state.status = 'idle';
        state.token = null;
        state.user = null;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
