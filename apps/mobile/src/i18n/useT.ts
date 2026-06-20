import { useLanguage } from './LanguageContext';
import type { TKey } from './en';

interface UseT {
  t: (key: TKey) => string;
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => Promise<void>;
}

export function useT(): UseT {
  return useLanguage();
}
