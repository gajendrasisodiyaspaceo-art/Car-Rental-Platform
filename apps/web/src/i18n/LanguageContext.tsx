import { useState, useEffect, useCallback, type ReactNode } from 'react';
import en, { type TKey } from './en';
import ar from './ar';
import { LanguageContext, getInitialLang, applyLang, type Lang } from './langContext';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  // Apply document dir/lang as a side effect (keeps the render pure).
  useEffect(() => {
    applyLang(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: TKey): string => {
      const dict = lang === 'ar' ? ar : en;
      return dict[key];
    },
    [lang],
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
