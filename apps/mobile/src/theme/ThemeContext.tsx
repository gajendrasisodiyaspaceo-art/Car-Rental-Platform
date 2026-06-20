import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { api } from '../api/client';
import { colors } from './tokens';

interface AppTheme {
  primaryColor: string;
  appName: string;
  logoUrl?: string;
}

interface ProviderSettings {
  appName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  currency?: string;
  supportedLanguages?: string[];
  defaultLanguage?: string;
  supportEmail?: string;
  supportPhone?: string;
}

const DEFAULT_THEME: AppTheme = {
  primaryColor: colors.accent,
  appName: 'Car Rental',
};

const ThemeContext = createContext<AppTheme>(DEFAULT_THEME);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<AppTheme>(DEFAULT_THEME);

  useEffect(() => {
    const providerId = process.env.EXPO_PUBLIC_PROVIDER_ID;
    if (!providerId) return;

    api
      .get<{ data?: ProviderSettings }>(`/settings/public?provider=${providerId}`)
      .then(({ data }) => {
        const settings = data.data;
        if (!settings) return;
        setTheme((prev) => ({
          ...prev,
          ...(settings.primaryColor ? { primaryColor: settings.primaryColor } : {}),
          ...(settings.appName ? { appName: settings.appName } : {}),
          ...(settings.logoUrl ? { logoUrl: settings.logoUrl } : {}),
        }));
      })
      .catch(() => {
        // Ignore failures — keep defaults
      });
  }, []);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}
