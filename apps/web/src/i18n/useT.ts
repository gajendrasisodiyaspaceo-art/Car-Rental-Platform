import { useContext } from 'react';
import { LanguageContext } from './langContext';

export function useT() {
  return useContext(LanguageContext);
}
