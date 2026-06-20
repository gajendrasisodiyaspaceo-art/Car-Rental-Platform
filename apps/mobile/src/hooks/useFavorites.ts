import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { toggleFavorite } from '../store/favoritesSlice';

export function useFavorites() {
  const dispatch = useAppDispatch();
  const ids = useAppSelector((s) => s.favorites.ids);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback(
    (id: string) => {
      dispatch(toggleFavorite(id));
    },
    [dispatch],
  );

  return { ids, isFavorite, toggle };
}

export default useFavorites;
