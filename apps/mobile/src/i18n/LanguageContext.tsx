import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en, { type TKey } from './en';
import ar from './ar';

// NOTE: Switching to Arabic (RTL) calls I18nManager.forceRTL(true) which takes
// effect on the NEXT native app launch on iOS/Android. This is expected behaviour
// for Expo managed workflow — a full RTL flip requires an app reload. Acceptable
// for this scaffold; a production implementation would prompt the user to restart.

type Lang = 'en' | 'ar';

const LANG_STORAGE_KEY = 'crp_lang';

const dictionaries: Record<Lang, Record<TKey, string>> = { en, ar };

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => Promise<void>;
  t: (key: TKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANG_STORAGE_KEY).then((stored) => {
      const resolved: Lang = stored === 'ar' ? 'ar' : 'en';
      setLangState(resolved);
      if (resolved === 'ar') {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      } else {
        I18nManager.forceRTL(false);
      }
    });
  }, []);

  const setLang = useCallback(async (next: Lang) => {
    await AsyncStorage.setItem(LANG_STORAGE_KEY, next);
    setLangState(next);
    if (next === 'ar') {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
  }, []);

  const t = useCallback(
    (key: TKey): string => dictionaries[lang][key] ?? dictionaries.en[key],
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
