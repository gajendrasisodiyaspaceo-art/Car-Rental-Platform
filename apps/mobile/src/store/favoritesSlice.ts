import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'crp_favorites';

interface FavoritesState {
  ids: string[];
  hydrated: boolean;
}

const initialState: FavoritesState = { ids: [], hydrated: false };

async function persist(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // non-critical — ignore persistence failures
  }
}

export const hydrateFavorites = createAsyncThunk('favorites/hydrate', async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [] as string[];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [] as string[];
  }
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.ids.includes(id)) {
        state.ids = state.ids.filter((x) => x !== id);
      } else {
        state.ids.push(id);
      }
      void persist(state.ids);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(hydrateFavorites.fulfilled, (state, action) => {
      state.ids = action.payload;
      state.hydrated = true;
    });
  },
});

export const { toggleFavorite } = favoritesSlice.actions;
export default favoritesSlice.reducer;
